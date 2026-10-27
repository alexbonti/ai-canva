import { describe, expect, it } from "vitest";
import type { BoxData } from "../types.js";
import {
  INTERRUPTED_RUN_MESSAGE,
  cleanBoxDataForFirestore,
  normalizeBoxDataForLoad,
} from "./serialization.js";

describe("cleanBoxDataForFirestore", () => {
  it("drops undefined values entirely", () => {
    const data: Record<string, BoxData> = {
      box1: {
        content: "hi",
        status: "done",
        error: undefined,
        output: "out",
      } as unknown as BoxData,
    };
    const cleaned = cleanBoxDataForFirestore(data);
    expect("error" in cleaned.box1).toBe(false);
    expect(cleaned.box1.content).toBe("hi");
  });

  it("strips base64 imageData but keeps http(s) image URLs", () => {
    const data: Record<string, BoxData> = {
      a: { imageData: "data:image/png;base64,AAAA", content: "x" } as unknown as BoxData,
      b: { imageData: "https://storage.example/a.png", content: "y" } as unknown as BoxData,
    };
    const cleaned = cleanBoxDataForFirestore(data);
    expect("imageData" in cleaned.a).toBe(false);
    expect(cleaned.b.imageData).toBe("https://storage.example/a.png");
  });

  it("preserves other fields unchanged", () => {
    const data: Record<string, BoxData> = {
      b: { content: "c", output: "o", status: "running", tokens: { promptTokens: 1, completionTokens: 2, totalTokens: 3 } } as unknown as BoxData,
    };
    const cleaned = cleanBoxDataForFirestore(data);
    expect(cleaned.b).toEqual(data.b);
  });

  it("keeps a full SDLC stage record intact with no nested undefined", () => {
    const stage = {
      content: "context",
      prompt: "p",
      systemPrompt: "s",
      output: "# Intent v2",
      status: "done",
      sdlcGate: "approved",
      sdlcGateRequired: true,
      sdlcApprovedVersion: 2,
      sdlcApprovedBy: "Ada",
      sdlcApprovedAt: 1700000005000,
      sdlcFeedback: "",
      skills: "No PII in logs.",
      sdlcVersions: [
        { version: 1, content: "# Intent", createdAt: 1, createdBy: "Ada", source: "generated", note: "" },
        { version: 2, content: "# Intent v2", createdAt: 2, createdBy: "Bo", source: "edited", note: "tightened" },
      ],
      sdlcHistory: [{ at: 2, actor: "Bo", action: "edited intent v2", note: "" }],
      sdlcFindings: [
        { id: "f1", severity: "blocking", description: "No auth check", location: "api.ts:42", dismissed: false, dismissedBy: "" },
      ],
      sdlcOpenItems: [],
      sdlcGaps: [],
      sdlcDeviation: false,
    } as unknown as BoxData;

    const cleaned = cleanBoxDataForFirestore({ i: stage });
    expect(cleaned.i).toEqual(stage);

    // Firestore rejects undefined ANYWHERE in a nested value — walk the whole
    // record the way the SDK would.
    const nested: unknown[] = [];
    const walk = (value: unknown) => {
      if (value === undefined) nested.push(value);
      else if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === "object") Object.values(value).forEach(walk);
    };
    walk(cleaned.i);
    expect(nested).toEqual([]);
  });
});

describe("cleanBoxDataForFirestore — nested undefined", () => {
  it("strips undefined inside arrays and objects (Slides-box regression)", () => {
    // Regression: parseSlidesResponse used to leave `notes: undefined` on every
    // slide without speaker notes. Firestore rejects the whole document, which
    // silently stopped ALL board saves after one Slides run.
    const data = {
      slidesBox: {
        status: "done",
        slides: [
          { title: "Problem", bullets: ["A"], notes: undefined },
          { title: "Solution", bullets: ["B"], notes: "say this" },
        ],
        changeSet: [{ path: "a.ts", original: "x", content: "y", extra: undefined }],
        nested: { keep: 1, drop: undefined, deeper: [{ ok: true, gone: undefined }] },
      },
    } as unknown as Record<string, BoxData>;

    const cleaned = cleanBoxDataForFirestore(data);
    const box = cleaned.slidesBox as Record<string, unknown>;
    expect(box.slides).toEqual([
      { title: "Problem", bullets: ["A"] },
      { title: "Solution", bullets: ["B"], notes: "say this" },
    ]);
    expect(box.nested).toEqual({ keep: 1, deeper: [{ ok: true }] });

    const found: unknown[] = [];
    const walk = (value: unknown) => {
      if (value === undefined) found.push(value);
      else if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === "object") Object.values(value).forEach(walk);
    };
    walk(cleaned);
    expect(found).toEqual([]);
  });
});

describe("normalizeBoxDataForLoad", () => {
  it("turns a persisted 'running' status into a recoverable error", () => {
    const data = {
      a: { status: "running", output: "old", prompt: "p", content: "c" },
      b: { status: "done", output: "ok", prompt: "p", content: "" },
    } as unknown as Record<string, BoxData>;

    const normalized = normalizeBoxDataForLoad(data);
    expect(normalized.a.status).toBe("error");
    expect(normalized.a.error).toBe(INTERRUPTED_RUN_MESSAGE);
    // The previous output is kept — the user can still read the last artifact.
    expect(normalized.a.output).toBe("old");
    // Untouched boxes are returned by reference.
    expect(normalized.b).toBe(data.b);
  });

  it("returns the same object when nothing needs repair", () => {
    const data = {
      a: { status: "idle" },
      b: { status: "error", error: "boom" },
    } as unknown as Record<string, BoxData>;
    expect(normalizeBoxDataForLoad(data)).toBe(data);
  });
});
