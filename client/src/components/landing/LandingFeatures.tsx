import { Icon } from "../ui/Icon.js";
import type { IconName } from "../ui/Icon.js";

interface Capability {
  icon: IconName;
  title: string;
  body: string;
}

const CAPABILITIES: Capability[] = [
  {
    icon: "history",
    title: "Versioned by default",
    body: "Builds and design changes append a version. Revert restores an old one as a new version, so the history never forks.",
  },
  {
    icon: "branch",
    title: "Gates that hold",
    body: "Six SDLC stages, review findings that actually block, and downstream stages that go stale the moment an upstream artifact changes.",
  },
  {
    icon: "zap",
    title: "Tokens, counted",
    body: "In and out per box, plus a running total in the header. A long run reports what it spent when it lands.",
  },
  {
    icon: "panel",
    title: "Palettes, not permissions",
    body: "Designer, developer, product and SDLC views narrow the Add Box palette. Board access is untouched.",
  },
  {
    icon: "globe",
    title: "Yours to publish",
    body: "Code, UI and Stitch boxes deploy to a live page. The browser never holds the key.",
  },
];

const PRESENCE = [
  { initials: "AL", color: "var(--pine)", action: "is editing", target: "PRD-01" },
  { initials: "MK", color: "var(--line-worker)", action: "is running", target: "RES-01" },
  { initials: "JD", color: "var(--line-collab)", action: "ticked", target: "Launch checklist" },
];

export default function LandingFeatures() {
  return (
    <section id="features" className="lp-section">
      <div className="lp-shell">
        <div className="lp-section-head">
          <h2 className="lp-section-title">The work is the interface.</h2>
          <p className="lp-section-lede">
            No settings pane owns the state. Each box carries its line, its code,
            its state and its token count, so the board explains itself. The rest
            is built for a team in a room.
          </p>
        </div>

        <div className="lp-features">
          <div className="lp-feature-lead">
            <h3>The whole room, on one sheet.</h3>
            <p>
              Presence cursors, a live roster and shared notes, checklists and
              timers. Hand a guest a seat code and they land on the same board the
              team is working in — no account, no second copy.
            </p>

            <div className="lp-presence">
              <div className="lp-presence-top">
                <span className="label-caps">On this board</span>
                <ul className="lp-roster" aria-label="Present collaborators">
                  {PRESENCE.map((person) => (
                    <li
                      key={person.initials}
                      className="lp-avatar"
                      style={{ backgroundColor: person.color }}
                    >
                      {person.initials}
                    </li>
                  ))}
                </ul>
                <span className="data-mono">3 live</span>
              </div>
              <div className="lp-presence-rows">
                {PRESENCE.map((person) => (
                  <div key={person.initials} className="lp-presence-row">
                    <span
                      className="lp-presence-dot"
                      style={{ backgroundColor: person.color }}
                      aria-hidden
                    />
                    <span className="data-mono">{person.initials}</span>
                    <span>{person.action}</span>
                    <span className="data-mono">{person.target}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <ul className="lp-feature-list">
            {CAPABILITIES.map((capability) => (
              <li key={capability.title} className="lp-feature">
                <span className="lp-feature-icon" aria-hidden>
                  <Icon name={capability.icon} size={16} />
                </span>
                <div>
                  <h3>{capability.title}</h3>
                  <p>{capability.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
