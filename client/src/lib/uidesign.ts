import type { NamedInput } from "../types.js";
import {
  UI_BRIEF_PROMPT,
  UI_BUILD_PROMPT,
  UI_BUILD_SYSTEM_PROMPT,
  UI_CHANGE_PROMPT,
} from "../types.js";
import { extractCode, isCompletePrototype, wrapUIInHtml } from "./code.js";
import { fillPromptTemplate } from "./prompts.js";

/**
 * The UI Design box, as a two-step pipeline (pure logic, unit-tested).
 *
 * 1. **Simplify** — the request and any connected research are condensed into a
 *    compact design brief. Long inputs used to make the box ask for a 20-30k
 *    token React prototype in one shot; that overflowed the output budget and
 *    produced "incomplete code" failures.
 * 2. **Build** — the brief becomes ONE self-contained HTML page (plain HTML +
 *    a single `<style>` block): no React, no build step, a few thousand tokens,
 *    quick to preview and directly deployable.
 *
 * Everything here is a pure string function so the store only orchestrates.
 */

/** Stage 1 user prompt: the (possibly long) request → one compact brief. */
export function buildDesignBriefPrompt(request: string): string {
  return fillPromptTemplate(UI_BRIEF_PROMPT, []).replace(
    /\{\{request\}\}/g,
    () => request.trim() || "[no design request given]"
  );
}

/**
 * Which system prompt the build stage uses.
 *
 * The box's system prompt is editable, and a user's own HTML instruction is
 * respected. Boards created before the HTML pipeline still store the old
 * "you are a React developer, output JSX" prompt — that would contradict the
 * build instructions, so it is replaced with the HTML prompt.
 */
export function uiBuildSystemPrompt(custom?: string): string {
  const text = (custom || "").trim();
  if (!text) return UI_BUILD_SYSTEM_PROMPT;
  if (/reactdom|jsx|javascript\s*\/\s*jsx|react\.createelement/i.test(text)) {
    return UI_BUILD_SYSTEM_PROMPT;
  }
  return text;
}

/** Stage 2 user prompt: the brief → one self-contained HTML page. */
export function buildUiBuildPrompt(brief: string): string {
  return fillPromptTemplate(UI_BUILD_PROMPT, []).replace(
    /\{\{brief\}\}/g,
    () => brief.trim() || "[no design brief given]"
  );
}

/**
 * The change-request prompt for an HTML-based UI Design box. Fixed (like
 * CODE_CHANGE_PROMPT): its rules are the safeguard against a rewrite that
 * silently drops sections.
 */
export function buildUiChangePrompt(opts: {
  code: string;
  request: string;
  context?: NamedInput[];
}): string {
  let filled = fillPromptTemplate(UI_CHANGE_PROMPT, []);
  filled = filled.replace(/\{\{code\}\}/g, () => opts.code.trim());
  filled = filled.replace(
    /\{\{request\}\}/g,
    () => opts.request.trim() || "[no change request given]"
  );

  const context = (opts.context || []).filter(
    (input) => (input.output || "").trim().length > 0
  );
  if (context.length > 0) {
    filled +=
      "\n\nAdditional context from connected boxes (use it, but still apply only the request above):\n" +
      context
        .map((input) => `${input.name}:\n${input.output.trim()}`)
        .join("\n\n---\n\n");
  }
  return filled;
}

/** True when the string is a complete HTML document (opening tag + `</html>`). */
export function isFullHtmlDocument(code: string): boolean {
  if (!code || !code.trim()) return false;
  const hasOpen = /<!DOCTYPE\s+html/i.test(code) || /<html[\s>]/i.test(code);
  return hasOpen && /<\/html\s*>/i.test(code);
}

/**
 * Cuts a model reply down to the HTML document inside it.
 *
 * Models wrap the file in markdown fences, and some prepend a sentence of
 * commentary ("Here is the page:"). This strips both and returns from
 * `<!DOCTYPE`/`<html` to `</html>`. It returns "" when the reply has no complete
 * document — the caller reports that honestly instead of previewing half a page.
 */
export function extractHtmlDocument(raw: string): string {
  if (!raw || !raw.trim()) return "";
  let code = extractCode(raw);

  // Some replies put the document after a line of prose; start at the markup.
  const open = code.search(/<!DOCTYPE\s+html|<html[\s>]/i);
  if (open > 0) code = code.slice(open);

  const close = /<\/html\s*>/i.exec(code);
  if (close) return code.slice(0, close.index + close[0].length).trim();

  // No closing tag — either prose only, or a truncated/fragment reply.
  return "";
}

/**
 * Wraps a bare HTML fragment (markup without `<html>`/`<head>`) in a minimal,
 * styled document so it can still be previewed and deployed.
 */
export function wrapHtmlFragment(fragment: string): string {
  return [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="UTF-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
    "  <style>",
    "    *, *::before, *::after { box-sizing: border-box; }",
    "    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif; color: #0f172a; background: #f8fafc; }",
    "    img { max-width: 100%; }",
    "  </style>",
    "</head>",
    "<body>",
    fragment.trim(),
    "</body>",
    "</html>",
  ].join("\n");
}

/**
 * A self-contained HTML document is previewed as-is; the iframe preview's
 * loading overlay is cleared by the usual `preview-ready` postMessage, which a
 * plain HTML file does not send — so add a tiny (idempotent) ping.
 */
export function ensurePreviewReadyPing(html: string): string {
  if (!html || /preview-ready/.test(html)) return html;
  const ping =
    "\n<script>window.parent.postMessage({ type: 'preview-ready' }, '*');</script>\n";
  if (/<\/body\s*>/i.test(html)) {
    return html.replace(/<\/body\s*>/i, `${ping}</body>`);
  }
  return html + ping;
}

/**
 * What the iframe should render for a UI Design box:
 * - a full HTML document → as-is (plus the preview-ready ping),
 * - legacy React code from before the HTML pipeline → the old CDN wrapper,
 * - a bare fragment → wrapped in a minimal document.
 */
export function toUiPreviewHtml(code: string): string {
  const source = (code || "").trim();
  if (!source) return "";
  if (isFullHtmlDocument(source)) return ensurePreviewReadyPing(source);
  if (isCompletePrototype(source)) return wrapUIInHtml(source);
  return wrapHtmlFragment(source);
}

/**
 * Normalizes a stage-2 model reply into something previewable.
 *
 * `complete` is true only for a real `<!DOCTYPE …</html>` file. A reply without
 * a document gets wrapped (models sometimes return just the body markup), but
 * the caller can still tell the difference — a truncated reply is reported as
 * truncated instead of silently accepted.
 */
export function normalizeUiDesign(raw: string): { html: string; complete: boolean } {
  const content = (raw || "").trim();
  if (!content) return { html: "", complete: false };

  const doc = extractHtmlDocument(content);
  if (doc) return { html: ensurePreviewReadyPing(doc), complete: true };

  const fragment = extractCode(content);
  if (!fragment || !/<[a-z][\s\S]*>/i.test(fragment)) {
    return { html: "", complete: false };
  }
  return { html: ensurePreviewReadyPing(wrapHtmlFragment(fragment)), complete: false };
}
