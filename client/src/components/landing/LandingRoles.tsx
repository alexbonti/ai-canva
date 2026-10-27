import { BOX_TYPES } from "../../types.js";
import type { BoxRole, BoxType } from "../../types.js";
import { LINE_COLORS } from "../../lib/lines.js";

type FilterRole = Exclude<BoxRole, "everyone">;

interface RoleColumn {
  role: FilterRole;
  title: string;
  body: string;
  /** The boxes this view surfaces beyond the shared set. */
  boxes: BoxType[];
  /** Real worker tools this role also gets, summarised quietly. */
  extra?: BoxType[];
}

const ROLE_COLUMNS: RoleColumn[] = [
  {
    role: "designer",
    title: "Designer",
    body: "Screens, images and decks. Draft a UI, generate a screen or turn the research into a deck — previewed in the box.",
    boxes: ["image", "ui", "stitch", "slides", "cartoon"],
  },
  {
    role: "developer",
    title: "Developer",
    body: "From plan to patch. Generate a prototype, map an unfamiliar repo, or turn a change request into a reviewable diff.",
    boxes: ["code", "devplan", "codemap", "codeedit"],
  },
  {
    role: "product",
    title: "Product",
    body: "The written artifact. Draft the PRD and the deck from the research behind them, with every source still on the board.",
    boxes: ["prd", "slides"],
  },
  {
    role: "sdlc",
    title: "SDLC",
    body: "The gated route. Six stages, one artifact each, with a gate before the next stage runs.",
    boxes: [
      "sdlc-intent",
      "sdlc-spec",
      "sdlc-plan",
      "sdlc-implement",
      "sdlc-review",
      "sdlc-merge",
    ],
    extra: ["codemap", "codeedit"],
  },
];

const BUILT_INS = (
  Object.entries(BOX_TYPES) as [BoxType, (typeof BOX_TYPES)[BoxType]][]
).filter(([type]) => type !== "custom");

const SHARED = BUILT_INS.filter(([, meta]) => meta.roles.includes("everyone"));

function visibleCount(role: FilterRole): number {
  return BUILT_INS.filter(
    ([, meta]) => meta.roles.includes("everyone") || meta.roles.includes(role)
  ).length;
}

export default function LandingRoles() {
  return (
    <section id="for-teams" className="lp-section">
      <div className="lp-shell">
        <div className="lp-section-head">
          <h2 className="lp-section-title">One board, four ways in.</h2>
          <p className="lp-section-lede">
            The palette adapts; the board does not. Pick a view and Add Box
            narrows to the stops that role reaches for. Nobody loses access to
            anything.
          </p>
        </div>

        <div className="lp-roles">
          {ROLE_COLUMNS.map((column) => (
            <div key={column.role} className="lp-role">
              <div className="lp-role-head">
                <h3>{column.title}</h3>
                <span className="data-mono">{visibleCount(column.role)} in view</span>
              </div>
              <p>{column.body}</p>

              <ul className="lp-role-list">
                {column.boxes.map((type) => (
                  <li key={type}>
                    <span
                      className="lp-line-dot"
                      style={{ backgroundColor: LINE_COLORS[BOX_TYPES[type].category] }}
                      aria-hidden
                    />
                    <span>{BOX_TYPES[type].label}</span>
                  </li>
                ))}
              </ul>

              {column.extra && (
                <p className="lp-role-extra">
                  + {column.extra.map((type) => BOX_TYPES[type].label).join(" · ")}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="lp-role-note">
          <span className="label-caps">Discovery filters, never permissions</span>
          <p>
            Every view keeps the same {SHARED.length} shared boxes:{" "}
            {SHARED.map(([, meta]) => meta.label).join(", ")}.
          </p>
        </div>
      </div>
    </section>
  );
}
