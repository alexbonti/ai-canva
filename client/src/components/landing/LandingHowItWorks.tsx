import type { ReactNode } from "react";

interface Step {
  n: string;
  title: string;
  body: ReactNode;
}

/**
 * The sequence is information here, so the steps carry mono numbers. Each row
 * is a timetable entry, not a card: hairline rules, one title column, one body.
 */
const STEPS: Step[] = [
  {
    n: "01",
    title: "Place the box",
    body: (
      <>
        Drop an Idea, Research, PRD or Code box onto the canvas. Twenty-six
        built-in types cover inputs, workers, the six SDLC stages, the Chatbot
        companion and the team&apos;s shared tools.
      </>
    ),
  },
  {
    n: "02",
    title: "Wire the route",
    body: (
      <>
        Connect one box to the next. Downstream prompts reference upstream output
        by name — <code className="lp-code">{"{{inputs}}"}</code>,{" "}
        <code className="lp-code">{"{{Research}}"}</code>,{" "}
        <code className="lp-code">{"{{input_1}}"}</code> — so content actually
        flows.
      </>
    ),
  },
  {
    n: "03",
    title: "Run the step",
    body: (
      <>
        Each box runs on its own. Text boxes record tokens in and out when they
        land; state is never cosmetic — running, done, error and stale are read
        from the box itself.
      </>
    ),
  },
  {
    n: "04",
    title: "Keep the record",
    body: (
      <>
        Builds and edits append versions; approvals and findings stay on the box.
        Send a stage back and everything downstream is marked stale, so an old
        artifact cannot pass as the current one.
      </>
    ),
  },
];

export default function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="lp-section">
      <div className="lp-shell">
        <div className="lp-section-head">
          <h2 className="lp-section-title">How it works.</h2>
          <p className="lp-section-lede">
            Four moves from a raw idea to an artifact you can hand on. No setup,
            no scripting — the canvas is the interface.
          </p>
        </div>

        <ol className="lp-steps">
          {STEPS.map((step) => (
            <li key={step.n} className="lp-step">
              <span className="data-mono lp-step-num">{step.n}</span>
              <h3 className="lp-step-title">{step.title}</h3>
              <p className="lp-step-body">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
