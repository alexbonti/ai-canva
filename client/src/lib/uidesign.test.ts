import { describe, expect, it } from "vitest";
import {
  buildDesignBriefPrompt,
  buildUiBuildPrompt,
  buildUiChangePrompt,
  ensurePreviewReadyPing,
  extractHtmlDocument,
  isFullHtmlDocument,
  normalizeUiDesign,
  toUiPreviewHtml,
  uiBuildSystemPrompt,
  wrapHtmlFragment,
} from "./uidesign.js";

const DOC = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Pricing</title><style>body{font-family:system-ui}</style></head>
<body><main><h1>Plans</h1><p>Pick one.</p></main></body>
</html>`;

const LEGACY_REACT = `function App() {
  return <div className="p-4">Hi</div>;
}
ReactDOM.createRoot(document.getElementById("root")).render(<App />);`;

describe("buildDesignBriefPrompt", () => {
  it("embeds the request and asks for a short brief, not code", () => {
    const prompt = buildDesignBriefPrompt("A dashboard with charts and a table");
    expect(prompt).toContain("A dashboard with charts and a table");
    expect(prompt).not.toContain("{{request}}");
    expect(prompt).toMatch(/Maximum 160 words/);
    expect(prompt).toMatch(/No code/);
  });

  it("falls back to a placeholder for an empty request", () => {
    expect(buildDesignBriefPrompt("   ")).toContain("[no design request given]");
  });
});

describe("buildUiBuildPrompt", () => {
  it("embeds the brief and demands one self-contained HTML file", () => {
    const prompt = buildUiBuildPrompt("Page: pricing. Sections: hero, 3 tiers.");
    expect(prompt).toContain("Page: pricing. Sections: hero, 3 tiers.");
    expect(prompt).not.toContain("{{brief}}");
    expect(prompt).toContain("<!DOCTYPE html>");
    expect(prompt).toContain("</html>");
    expect(prompt).toMatch(/under 300 lines/);
  });
});

describe("buildUiChangePrompt", () => {
  it("includes the current page and the request", () => {
    const prompt = buildUiChangePrompt({ code: DOC, request: "Add a billing toggle" });
    expect(prompt).toContain("<!DOCTYPE html>");
    expect(prompt).toContain("Add a billing toggle");
    expect(prompt).toContain("COMPLETE HTML file");
  });

  it("appends connected context but keeps the request", () => {
    const prompt = buildUiChangePrompt({
      code: DOC,
      request: "Dark mode",
      context: [{ name: "Review", output: "The contrast is too low." }],
    });
    expect(prompt).toContain("The contrast is too low.");
    expect(prompt).toContain("Dark mode");
  });
});

describe("isFullHtmlDocument / extractHtmlDocument", () => {
  it("accepts a complete document", () => {
    expect(isFullHtmlDocument(DOC)).toBe(true);
    expect(extractHtmlDocument(DOC)).toBe(DOC);
  });

  it("rejects a fragment or a truncated page", () => {
    expect(isFullHtmlDocument("<div>only a fragment</div>")).toBe(false);
    expect(isFullHtmlDocument("<!DOCTYPE html><html><body><h1>cut off")).toBe(false);
    expect(extractHtmlDocument("<!DOCTYPE html><html><body><h1>cut off")).toBe("");
  });

  it("strips markdown fences and commentary around the document", () => {
    const fenced = "Here is the page:\n\n```html\n" + DOC + "\n```\n\nEnjoy!";
    expect(extractHtmlDocument(fenced)).toBe(DOC);
  });

  it("returns empty for prose-only replies", () => {
    expect(extractHtmlDocument("I cannot build that.")).toBe("");
  });
});

describe("normalizeUiDesign", () => {
  it("keeps a complete document and marks it complete", () => {
    const { html, complete } = normalizeUiDesign("```html\n" + DOC + "\n```");
    expect(complete).toBe(true);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("preview-ready");
  });

  it("wraps a bare fragment so it can still be previewed", () => {
    const { html, complete } = normalizeUiDesign("<section><h1>Hi</h1></section>");
    expect(complete).toBe(false);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<h1>Hi</h1>");
  });

  it("returns nothing for a prose-only reply", () => {
    expect(normalizeUiDesign("Sorry, I cannot do that.")).toEqual({ html: "", complete: false });
  });
});

describe("preview documents", () => {
  it("adds the preview-ready ping exactly once", () => {
    const once = ensurePreviewReadyPing(DOC);
    expect(once).toContain("preview-ready");
    expect(ensurePreviewReadyPing(once)).toBe(once);
  });

  it("previews a full document as-is, a legacy React box via the CDN wrapper, and a fragment wrapped", () => {
    expect(toUiPreviewHtml(DOC)).toContain("<title>Pricing</title>");

    const legacy = toUiPreviewHtml(LEGACY_REACT);
    expect(legacy).toContain("babel.min.js");
    expect(legacy).toContain("function App()");

    const wrapped = toUiPreviewHtml("<div>fragment</div>");
    expect(wrapped).toContain("<!DOCTYPE html>");
    expect(wrapped).toContain("<div>fragment</div>");
  });

  it("handles empty code", () => {
    expect(toUiPreviewHtml("")).toBe("");
  });

  it("wrapHtmlFragment produces a complete document", () => {
    expect(isFullHtmlDocument(wrapHtmlFragment("<p>x</p>"))).toBe(true);
  });
});

describe("uiBuildSystemPrompt", () => {
  it("defaults to the HTML build prompt", () => {
    expect(uiBuildSystemPrompt("")).toContain("self-contained HTML");
    expect(uiBuildSystemPrompt(undefined)).toContain("self-contained HTML");
  });

  it("replaces a stale pre-HTML React prompt from an older board", () => {
    const stale =
      "You are an expert UI designer and React developer. Output ONLY JavaScript/JSX code. Define App component.";
    expect(uiBuildSystemPrompt(stale)).toContain("self-contained HTML");
    expect(uiBuildSystemPrompt(stale)).not.toContain("ReactDOM");
  });

  it("respects a user's own custom system prompt", () => {
    const custom = "You are a designer who writes minimal, accessible pages.";
    expect(uiBuildSystemPrompt(custom)).toBe(custom);
  });
});
