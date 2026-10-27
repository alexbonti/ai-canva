import { useState, type ReactNode } from "react";
import { Icon } from "./ui/Icon.js";

/**
 * Canvas help card ("How to use") — bottom-left, dismissible to a "?" pill.
 *
 * Printed like a station notice: small-caps header, numbered mono steps,
 * hairline rules. The E2E suite locates this card by finding a `rounded-xl`
 * div whose text includes "How to use" — keep both markers when restyling.
 */
export default function Toolbar() {
  const [open, setOpen] = useState(true);

  return (
    <div className="help-anchor absolute bottom-4 left-4 z-10">
      {open ? (
        <div
          role="complementary"
          aria-label="How to use"
          className="rounded-xl bg-card border border-rule shadow-float w-[308px] overflow-hidden"
        >
          <div className="flex items-center justify-between pl-3.5 pr-2 h-10 border-b border-rule">
            <h2 className="label-caps text-ink">How to use</h2>
            <button
              onClick={() => setOpen(false)}
              className="box-icon-btn"
              title="Hide help"
            >
              <Icon name="x" size={13} />
            </button>
          </div>

          <ol className="px-3.5 py-2.5 space-y-2">
            {(
              [
                <>
                  Add boxes from the panel on the right{" "}
                  <span className="font-medium text-ink">(Add Box)</span>.
                </>,
                <>
                  Type your idea in an <span className="font-medium text-ink">Idea</span> box,
                  or upload an image in an <span className="font-medium text-ink">Image</span> box.
                </>,
                <>
                  Drag from a box's right-edge connector to another box's left-edge connector
                  to draw a route.
                </>,
                <>
                  Click <span className="font-medium text-ink">Run</span> on any AI box to
                  generate output.
                </>,
                <>
                  Click the <span className="font-medium text-ink">settings</span> button to
                  edit the prompt —
                  reference connected inputs with{" "}
                  <code className="data-mono bg-paper-raised border border-rule px-1 rounded-xs">
                    {"{{input_1}}"}
                  </code>
                  ,{" "}
                  <code className="data-mono bg-paper-raised border border-rule px-1 rounded-xs">
                    {"{{inputs}}"}
                  </code>
                  .
                </>,
                <>Click a box, then drag the corner handles to resize it.</>,
              ] as ReactNode[]
            ).map((step, i) => (
              <li key={i} className="flex gap-2.5 text-[11.5px] text-ink-soft leading-relaxed">
                <span className="data-mono w-3.5 mt-0.5 text-ink-muted flex-shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          <div className="px-3.5 py-2.5 border-t border-rule space-y-1.5 bg-paper-raised">
            <p className="text-[11px] text-ink-muted leading-snug">
              <span className="font-semibold text-ink-soft">Cartoon</span> — connect an Image
              box to cartoonify it, or an Idea box for text-to-image.
            </p>
            <p className="text-[11px] text-ink-muted leading-snug">
              <span className="font-semibold text-ink-soft">Slides</span> — connect Research
              boxes to generate a navigable pitch deck.
            </p>
            <p className="text-[11px] text-ink-muted leading-snug">
              <span className="font-semibold text-ink-soft">Code</span> — connect a PRD or
              Research box for a live React prototype.
            </p>
          </div>

          <div className="px-3.5 py-2 border-t border-rule">
            <p className="data-mono text-[11px] text-ink-muted leading-snug">
              Boards auto-save — browser when signed out, cloud when signed in.
            </p>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 rounded-full bg-card border border-rule shadow-float flex items-center justify-center text-ink-muted hover:text-ink hover:border-rule-strong transition"
          title="Show help"
        >
          <Icon name="help" size={16} />
        </button>
      )}
    </div>
  );
}
