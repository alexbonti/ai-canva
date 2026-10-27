import { BOX_TYPES } from "../../types.js";
import type { BoxCategory, BoxType } from "../../types.js";
import { LINE_COLORS } from "../../lib/lines.js";

interface BoxGroup {
  category: BoxCategory;
  title: string;
  /** The curated rows shown in full, with a one-line description. */
  types: BoxType[];
  /** The rest of that line, named quietly underneath. */
  more?: BoxType[];
}

/**
 * A curated index of the real box types. Every label, category and line colour
 * comes from BOX_TYPES/LINE_COLORS — nothing here invents a box or its line.
 */
const GROUPS: BoxGroup[] = [
  {
    category: "input",
    title: "Input",
    types: ["idea", "image", "documents"],
  },
  {
    category: "worker",
    title: "Worker",
    types: ["agent", "research", "prd", "code", "ui", "slides"],
    more: ["devplan", "codemap", "codeedit", "summarize", "stitch", "cartoon"],
  },
  {
    category: "sdlc",
    title: "SDLC",
    types: [
      "sdlc-intent",
      "sdlc-spec",
      "sdlc-plan",
      "sdlc-implement",
      "sdlc-review",
      "sdlc-merge",
    ],
  },
  {
    category: "collab",
    title: "Collaboration",
    types: ["note", "label", "timer", "checklist"],
  },
  {
    category: "companion",
    title: "Companion",
    types: ["chatbot"],
  },
  {
    category: "custom",
    title: "Custom",
    types: ["custom"],
  },
];

/** One truthful line per curated box, in the product's own terms. */
const ONE_LINERS: Partial<Record<BoxType, string>> = {
  idea: "Write the raw thought down. No AI, just your text.",
  image: "Upload a reference image for the boxes downstream.",
  documents: "Drop in PDFs, Word or text files; their text becomes input.",
  agent: "Give it a task; it builds and runs boxes on the board.",
  research: "Ask a topic and get a Markdown research brief.",
  prd: "Turn research into features, stories and requirements.",
  code: "Generate a React prototype with a live preview.",
  ui: "Simplify a brief, then build one self-contained HTML page.",
  slides: "Create a deck from the research behind it.",
  "sdlc-intent": "The change request, with every open question still visible.",
  "sdlc-spec": "Open questions resolved into rules, with org skills applied.",
  "sdlc-plan": "Files, order and a named test for every decision.",
  "sdlc-implement": "The diff, plus evidence for each planned test.",
  "sdlc-review": "Findings tagged blocking, important or nit.",
  "sdlc-merge": "Checklist, commit message and PR — the human ship decision.",
  note: "A post-it the whole board can read.",
  label: "Colour and name an area of the canvas.",
  timer: "One countdown everyone sees; anyone can run it.",
  checklist: "A shared to-do list with owners and ticks.",
  chatbot: "A stick-figure pal that talks with the team and sees the board.",
  custom: "Your own reusable AI box templates.",
};

const BUILT_IN_COUNT = Object.keys(BOX_TYPES).filter((type) => type !== "custom").length;

function countOnLine(category: BoxCategory): number {
  return Object.values(BOX_TYPES).filter((meta) => meta.category === category).length;
}

function Group({ group }: { group: BoxGroup }) {
  const line = LINE_COLORS[group.category];
  return (
    <section className="lp-box-group" aria-labelledby={`box-line-${group.category}`}>
      <div className="lp-box-group-head">
        <span
          className="lp-line-dot"
          style={{ backgroundColor: line }}
          aria-hidden
        />
        <h3 id={`box-line-${group.category}`} className="label-caps">
          {group.title}
        </h3>
        <span className="data-mono">
          {String(countOnLine(group.category)).padStart(2, "0")}
        </span>
      </div>

      <ul className="lp-box-rows">
        {group.types.map((type) => (
          <li key={type} className="lp-box-row">
            <span
              className="lp-line-dot"
              style={{ backgroundColor: line }}
              aria-hidden
            />
            <span className="lp-box-label">{BOX_TYPES[type].label}</span>
            <span className="lp-box-desc">{ONE_LINERS[type]}</span>
          </li>
        ))}
      </ul>

      {group.more && (
        <p className="lp-box-more">
          Also on this line:{" "}
          {group.more.map((type) => BOX_TYPES[type].label).join(", ")}.
        </p>
      )}
    </section>
  );
}

export default function LandingBoxes() {
  return (
    <section id="boxes" className="lp-section">
      <div className="lp-shell">
        <div className="lp-section-head">
          <h2 className="lp-section-title">Twenty-six stops, six lines.</h2>
          <p className="lp-section-lede">
            Every box is a focused AI step or a shared team tool. Its colour is
            the line it belongs to — never a badge for the individual box.
          </p>
        </div>

        <div className="lp-box-index">
          <div>
            {GROUPS.slice(0, 2).map((group) => (
              <Group key={group.category} group={group} />
            ))}
          </div>
          <div>
            {GROUPS.slice(2).map((group) => (
              <Group key={group.category} group={group} />
            ))}
          </div>
        </div>

        <div className="lp-box-note">
          <span className="label-caps">Line key</span>
          <p>
            Colour belongs to the category, never the individual box. A board
            with twenty boxes still reads as six lines — and every code, token
            count and version sits in mono, exactly once.
          </p>
          <span className="data-mono">{BUILT_IN_COUNT} built-in</span>
        </div>
      </div>
    </section>
  );
}
