import type { CSSProperties } from "react";
import { BOX_TYPES } from "../../types.js";
import type { BoxType } from "../../types.js";
import { LINE_COLORS, stationCode } from "../../lib/lines.js";
import { BOX_ICON, Icon } from "../ui/Icon.js";
import Reveal from "./Reveal.js";

interface LandingHeroProps {
  onSignIn: () => void;
  signingIn: boolean;
}

interface Station {
  type: BoxType;
  desc: string;
  state: "idle" | "done";
  tokens: string;
}

/**
 * The demo board's four stops. Descriptions are sample-board content; names,
 * codes, categories and states all come from the real BOX_TYPES data.
 */
const STATIONS: Station[] = [
  {
    type: "idea",
    desc: "A week of weeknight dinners, decided on Sunday.",
    state: "idle",
    tokens: "0 tok",
  },
  {
    type: "research",
    desc: "What people actually cook when they get home late.",
    state: "done",
    tokens: "2,480 tok",
  },
  {
    type: "prd",
    desc: "The smallest planner that still gets dinner on the table.",
    state: "done",
    tokens: "1,904 tok",
  },
  {
    type: "code",
    desc: "A working React prototype, previewed in the box.",
    state: "done",
    tokens: "3,412 tok",
  },
];

const ARTIFACT_CODE = `import React from "react";
const seed = ["Miso noodles"];
export default function App() {
  const [plan] = React.useState(seed);
  return (
    <main style={{ padding: 24 }}>
      <h1>Weeknight plan</h1>
      <ul>
        {plan.map((m) => <li key={m}>{m}</li>)}
      </ul>
    </main>
  );
}`;

export default function LandingHero({ onSignIn, signingIn }: LandingHeroProps) {
  const terminalLine = LINE_COLORS[BOX_TYPES.code.category];

  return (
    <section id="top" className="lp-hero">
      <div className="lp-shell lp-hero-grid">
        <div className="lp-hero-copy">
          <h1 className="lp-display">
            Build AI pipelines<span className="lp-stop">.</span>
          </h1>
          <p className="lp-hero-lede">
            Visual AI pipelines on one shared board: every step a box, every
            connection a printed line. The route from a raw idea to working code
            stays visible — and every artifact keeps its provenance.
          </p>

          <div className="lp-hero-actions">
            <button
              type="button"
              onClick={onSignIn}
              disabled={signingIn}
              aria-busy={signingIn}
              className="lp-btn lp-btn--signal lp-btn--lg"
            >
              {signingIn ? "Connecting…" : "Start a board"}
              {!signingIn && <Icon name="arrowRight" size={14} />}
            </button>
            <a href="#how-it-works" className="lp-btn lp-btn--quiet lp-btn--lg">
              See the route
            </a>
          </div>

          <div className="lp-hero-meta">
            <span className="label-caps">On the board</span>
            <span className="data-mono">26 box types · 6 gated SDLC stages</span>
          </div>
        </div>

        <Reveal className="lp-hero-figure">
          <figure className="lp-route-figure">
            <div className="lp-route-sheet">
              <div className="lp-route-head">
                <span className="data-mono">DEMO BOARD 01</span>
                <span className="label-caps lp-route-line-label">Idea → Code</span>
                <span className="data-mono">04 STOPS</span>
              </div>

              <div className="lp-route-body">
                <ol className="lp-route-list">
                  {STATIONS.map((station) => {
                    const meta = BOX_TYPES[station.type];
                    const line = LINE_COLORS[meta.category];
                    const wash = line + "14";
                    return (
                      <li
                        key={station.type}
                        className="lp-route-stop"
                        style={{ "--line": line } as CSSProperties}
                      >
                        <div className="lp-route-gutter" aria-hidden>
                          <span className="lp-route-leg" />
                          <span className="lp-route-stub" />
                          <span className="lp-route-knot" />
                        </div>

                        <div className="lp-station">
                          <div
                            className="lp-station-head"
                            style={{ backgroundColor: wash }}
                          >
                            <Icon name={BOX_ICON[station.type]} size={13} />
                            <span className="lp-station-name">{meta.label}</span>
                            <span className="data-mono lp-station-code">
                              {stationCode(station.type, 1)}
                            </span>
                          </div>
                          <p className="lp-station-desc">{station.desc}</p>
                          <div className="lp-station-foot">
                            <span
                              className={
                                "lp-state" +
                                (station.state === "done" ? " lp-state--done" : "")
                              }
                            >
                              {station.state}
                            </span>
                            <span className="data-mono lp-station-tok">
                              {station.tokens}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>

                <div
                  className="lp-route-terminal"
                  style={{ "--line": terminalLine } as CSSProperties}
                >
                  <svg
                    className="lp-route-elbow"
                    viewBox="0 0 25 22"
                    aria-hidden
                    focusable="false"
                  >
                    <path d="M9 0 V12 Q9 22 19 22 H25" />
                  </svg>

                  <div className="lp-artifact">
                    <div className="lp-artifact-head">
                      <span className="label-caps">Output</span>
                      <span className="data-mono">
                        {stationCode("code", 1)}
                      </span>
                      <span className="data-mono lp-artifact-file">App.jsx</span>
                    </div>
                    <pre
                      className="lp-artifact-code"
                      tabIndex={0}
                      aria-label="Sample Code box output: a React component called App"
                    >{ARTIFACT_CODE}</pre>
                    <span className="data-mono lp-artifact-page">01 / 01</span>
                  </div>
                </div>
              </div>
            </div>

            <figcaption className="lp-route-caption">
              <span className="label-caps">Sample board</span>
              <span>One idea, four boxes, a working prototype.</span>
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
