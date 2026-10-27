import { Stitch, StitchToolClient } from "@google/stitch-sdk";

let _projectId: string | null = null;

/**
 * The Stitch API's accepted `modelId` enum is controlled server-side and has
 * changed before: `GEMINI_3_FLASH` (the previous default) was removed, and
 * sending it now fails with "Request contains an invalid argument" — which
 * broke the Stitch UI box for every prompt. So a single hardcoded id is not
 * safe. Candidates are tried in order:
 *
 *   1. `STITCH_MODEL` (env override, when set),
 *   2. the current known-good flash models,
 *   3. `""` — let Stitch pick its own default model.
 *
 * An id rejected as invalid retries with the next candidate instead of failing
 * the run; the first working id is remembered for the rest of the process.
 * Keep this module in sync with `functions/src/stitch.ts`.
 *
 * The env var is read lazily (not at module load): ES module imports are
 * hoisted, so module-level code runs before `dotenv.config()` in index.ts.
 */
function modelCandidates(): string[] {
  const envModel = (process.env.STITCH_MODEL || "").trim();
  return [
    ...(envModel ? [envModel] : []),
    "GEMINI_3_5_FLASH_LITE",
    "GEMINI_3_8_FLASH",
    "", // let Stitch pick its own default model
  ].filter((value, index, all) => all.indexOf(value) === index);
}

/** The model id that last worked ("" = the provider's default model). */
let _workingModel: string | null = null;

// Cap the prompt so real pipelines (e.g. a whole Research box via {{inputs}})
// don't make Stitch time out or return a written spec instead of a UI screen.
const MAX_PROMPT_CHARS = 6000;

/** True when Stitch rejected the request arguments (e.g. a retired model id). */
function isInvalidArgumentError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err || "");
  return /invalid argument|INVALID_ARGUMENT/i.test(message);
}

/**
 * True for transport-level failures that are worth retrying: generation takes
 * 30-50s over a streamable HTTP connection, and the provider (or a proxy in
 * between) occasionally closes it mid-request ("fetch failed", "other side
 * closed", 502/503). Those are transient — the same call usually succeeds on a
 * fresh connection, so one retry saves the box instead of showing an error.
 */
function isTransientError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err || "");
  return /fetch failed|other side closed|socket|ECONNRESET|ECONNREFUSED|ETIMEDOUT|Streamable HTTP error|Incomplete API response from generate_screen_from_text|\b(502|503|504)\b/i.test(
    message
  );
}

/** Small delay between retries (ms). */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Creates (once) and returns the Stitch project id used by every run. */
async function ensureProjectId(client: Stitch): Promise<string> {
  if (_projectId) return _projectId;
  const project = await client.createProject("AI Canva");
  _projectId = project.id;
  return _projectId;
}

/**
 * Generates a UI screen from a text prompt using Google Stitch.
 * Returns the HTML content and a screenshot URL.
 */
export async function generateStitchUI(
  prompt: string
): Promise<{ html: string; imageUrl: string }> {
  const apiKey = process.env.STITCH_API_KEY;
  if (!apiKey) {
    throw new Error("STITCH_API_KEY is not configured.");
  }

  const trimmed = prompt.trim();
  if (trimmed.length === 0) {
    throw new Error("No prompt provided. Type a description or connect an input.");
  }
  const shortPrompt =
    trimmed.length > MAX_PROMPT_CHARS
      ? trimmed.slice(0, MAX_PROMPT_CHARS).trim()
      : trimmed;

  // Try the model that worked last time first, then every other candidate.
  const known = modelCandidates();
  const candidates =
    _workingModel === null
      ? known
      : [_workingModel, ...known.filter((m) => m !== _workingModel)];

  const tried: string[] = [];
  // Bound the work: a generation takes 30-50s, so allow at most four attempts
  // in total (one per model id at most twice).
  let budget = 4;
  outer: for (const model of candidates) {
    // A failed MCP call poisons the shared singleton's transport ("Already
    // connected to a transport…"), so each attempt gets a fresh client that is
    // closed afterwards. Stitch generation is slow, so one client per run is
    // cheap relative to the generation itself.
    for (let attempt = 1; attempt <= 2 && budget > 0; attempt++) {
      budget--;
      const client = new StitchToolClient({ apiKey });
      const stitchClient = new Stitch(client);
      tried.push(model || "(provider default)");
      try {
        const projectId = await ensureProjectId(stitchClient);
        const project = stitchClient.project(projectId);
        // The SDK's types pin the old enum, so the id is passed through as-is:
        // the candidate list above is what the live API actually accepts.
        const screen = await project.generate(
          shortPrompt,
          "AGNOSTIC",
          (model || undefined) as Parameters<typeof project.generate>[2]
        );

        // Get the HTML download URL and fetch the actual HTML content
        const htmlUrl = await screen.getHtml();
        const imageUrl = await screen.getImage();

        // Fetch the HTML content from the download URL
        // The CDN download is separate from the MCP call — bound it so a stuck
        // CDN response cannot hang the (already long) job forever.
        const htmlResponse = await fetch(htmlUrl, { signal: AbortSignal.timeout(30_000) });
        if (!htmlResponse.ok) {
          throw new Error("Failed to fetch Stitch HTML: " + htmlResponse.status);
        }
        const html = await htmlResponse.text();

        _workingModel = model;
        return { html, imageUrl };
      } catch (err) {
        // A retired model id: move on to the next candidate (no point retrying
        // the same id). Anything else only retries when it looks transient.
        if (isInvalidArgumentError(err)) {
          if (model !== candidates[candidates.length - 1]) {
            console.warn(
              `[stitch] model "${model || "(provider default)"}" was rejected — trying the next known-good id`
            );
          }
          continue outer;
        }
        if (isTransientError(err) && attempt === 1 && budget > 0) {
          console.warn(
            `[stitch] transient transport error on model "${model || "(provider default)"}" — retrying once`
          );
          await delay(1500);
          continue;
        }
        throw err;
      } finally {
        await client.close().catch(() => {});
      }
    }
  }

  throw new Error(
    `Stitch rejected every known model id (${tried.join(", ")}). ` +
      "The provider may have changed its supported models — update modelCandidates() in stitch.ts."
  );
}
