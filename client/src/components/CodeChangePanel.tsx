import { useState } from "react";
import { useBoardStore } from "../store/boardStore.js";
import type { BoxData, BoxType } from "../types.js";
import { computeLineDiff, lineDiff } from "../lib/codeedit.js";
import { Button } from "./ui/Button.js";
import { Icon } from "./ui/Icon.js";

/**
 * AI change requests for a Code / UI Design box, with the safety net.
 *
 * The AI rewrites the whole component (that is the only reliable way to ask a
 * model for a code change), so the app shows what actually moved and keeps every
 * previous version. That is what makes a mangled rewrite cost one click instead
 * of the whole box.
 *
 * Styling follows "The Printed Line": the request field is an inline form, the
 * version strip is a ruled row of mono figures, and the diff is a pine-deep code
 * block whose added/removed lines carry the state-ok / state-error wash over
 * cream mono text (the raw state hexes do not carry enough contrast for 10px
 * glyphs on pine-deep).
 */
export default function CodeChangePanel({ id, boxType }: { id: string; boxType: BoxType }) {
  const boxData = useBoardStore((s) => s.boxData[id]);
  const updateBoxData = useBoardStore((s) => s.updateBoxData);
  const applyChangeRequest = useBoardStore((s) => s.applyChangeRequest);
  const revertCodeVersion = useBoardStore((s) => s.revertCodeVersion);

  const [showHistory, setShowHistory] = useState(false);
  const [viewVersion, setViewVersion] = useState<number | null>(null);
  const [showDiff, setShowDiff] = useState(false);

  if (!boxData || !boxData.code) return null;

  const versions = boxData.codeVersions || [];
  const currentVersion = boxData.codeVersion || 0;
  const current = versions.find((v) => v.version === currentVersion);
  // The diff of the current version against the one before it — what the last
  // build or change actually did.
  const previous = versions.filter((v) => v.version < currentVersion).pop();
  const stats = previous && current ? lineDiff(previous.content, current.content) : null;
  const isRunning = boxData.status === "running";
  const viewed = viewVersion !== null ? versions.find((v) => v.version === viewVersion) : null;

  /** One diff-line tone: a state wash for changed lines, quiet cream for context. */
  const diffTone = (type: string) =>
    type === "+"
      ? "bg-[rgba(46,125,79,0.22)] text-cream"
      : type === "-"
        ? "bg-[rgba(179,58,43,0.24)] text-cream"
        : "text-[rgba(242,237,225,0.62)]";

  return (
    <div className="mt-2 space-y-2 border-t border-rule pt-2">
      {/* Ask the AI to change the code it already produced */}
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={boxData.changePrompt || ""}
          onChange={(e) => updateBoxData(id, { changePrompt: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isRunning && (boxData.changePrompt || "").trim()) applyChangeRequest(id);
          }}
          placeholder="Request a change… e.g. “make the header dark and add a search field”"
          className="nodrag h-8 min-w-0 flex-1 rounded-sm border border-rule bg-card px-2 text-[11.5px] text-ink placeholder:text-ink-muted"
          title="The AI applies this to the code in this box. Nothing else is rewritten."
        />
        <Button
          variant="primary"
          size="xs"
          onClick={() => applyChangeRequest(id)}
          disabled={isRunning || !(boxData.changePrompt || "").trim()}
          className="flex-shrink-0 whitespace-nowrap"
          title="Ask the AI to apply the change to the current code"
          icon={<Icon name="wand" size={12} />}
        >
          {isRunning ? "Applying…" : "Apply change"}
        </Button>
      </div>

      {/* What the last change did, and how to undo it */}
      {versions.length > 0 ? (
        <div className="border-t border-rule">
          <div className="flex flex-wrap items-center gap-2 py-1.5">
            <span className="inline-flex h-[18px] items-center rounded-xs border border-rule bg-card px-1.5 data-mono font-medium text-ink-soft">
              v{currentVersion}
            </span>
            {stats && (stats.added > 0 || stats.removed > 0) && (
              <span className="data-mono font-medium">
                <span className="text-state-ok">+{stats.added}</span>{" "}
                <span className="text-state-error">−{stats.removed}</span>
                <span className="text-ink-muted"> vs v{previous?.version}</span>
              </span>
            )}
            {previous && (
              <button
                onClick={() => setShowDiff((v) => !v)}
                className="rounded-xs border border-rule bg-card px-1.5 py-0.5 text-[11px] text-ink-soft transition-colors hover:bg-paper-raised hover:text-ink"
                title="Show the line-by-line difference from the previous version"
              >
                {showDiff ? "Hide diff" : "Diff"}
              </button>
            )}
            <button
              onClick={() => { setShowHistory((v) => !v); setViewVersion(null); }}
              className="ml-auto flex items-center gap-1 whitespace-nowrap rounded-xs border border-rule bg-card px-1.5 py-0.5 text-[11px] text-ink-soft transition-colors hover:bg-paper-raised hover:text-ink"
              title="Every version is kept — nothing is ever overwritten"
            >
              <Icon name="history" size={10} />
              {versions.length} version{versions.length === 1 ? "" : "s"}
            </button>
          </div>

          {current?.note && current.note !== "initial build" && (
            <p className="pb-1 text-[11px] leading-snug text-ink-muted">requested: {current.note}</p>
          )}

          {showDiff && previous && current && (
            <pre className="nodrag nowheel max-h-48 overflow-auto border-y border-pine bg-pine-deep px-2.5 py-2 font-mono text-[11px] leading-[1.5] text-cream whitespace-pre">
              {computeLineDiff(previous.content, current.content).map((op, i) => (
                <div key={i} className={diffTone(op.type)}>
                  {op.type + op.line}
                </div>
              ))}
            </pre>
          )}

          {showHistory && (
            <div className="border-t border-rule pt-1.5">
              <div>
                {[...versions].reverse().map((version) => {
                  const before = versions.filter((v) => v.version < version.version).pop();
                  const delta = before ? lineDiff(before.content, version.content) : null;
                  return (
                    <div
                      key={version.version}
                      className="flex items-center gap-2 border-b border-rule py-1 text-[11px] last:border-b-0"
                    >
                      <span className="data-mono w-6 flex-shrink-0 font-medium text-ink-soft">v{version.version}</span>
                      <span className="flex flex-shrink-0 items-center gap-1 whitespace-nowrap text-ink-muted">
                        <Icon name={version.source === "edited" ? "rotate" : "wand"} size={10} />
                        {delta ? (
                          <span className="data-mono">
                            <span className="text-state-ok">+{delta.added}</span>{" "}
                            <span className="text-state-error">−{delta.removed}</span>
                          </span>
                        ) : (
                          "build"
                        )}
                      </span>
                      <span className="truncate text-ink-soft" title={version.note}>
                        {version.note.trim() ? version.note : "—"}
                      </span>
                      <span className="flex-1" />
                      {version.version === currentVersion ? (
                        <span className="inline-flex h-[16px] flex-shrink-0 items-center rounded-xs bg-[rgba(18,50,41,0.08)] px-1 data-mono text-pine">
                          current
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => setViewVersion(viewVersion === version.version ? null : version.version)}
                            className="flex-shrink-0 whitespace-nowrap rounded-xs border border-rule bg-card px-1.5 py-0.5 text-ink-soft transition-colors hover:bg-paper-raised hover:text-ink"
                          >
                            {viewVersion === version.version ? "hide" : "view"}
                          </button>
                          <button
                            onClick={() => { revertCodeVersion(id, version.version); setViewVersion(null); }}
                            className="flex flex-shrink-0 items-center gap-1 whitespace-nowrap rounded-xs border border-rule bg-card px-1.5 py-0.5 text-ink-soft transition-colors hover:bg-paper-raised hover:text-ink"
                            title={`Restore v${version.version} (kept as a new version — history is never rewritten)`}
                          >
                            <Icon name="rotate" size={10} />
                            Revert
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              {viewed && (
                <pre className="nodrag nowheel mt-1.5 max-h-40 overflow-auto rounded-sm border border-rule bg-card p-2 font-mono text-[11px] leading-snug text-ink-soft whitespace-pre-wrap">
                  {viewed.content}
                </pre>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="border-t border-rule pt-1.5 text-[11px] leading-snug text-ink-muted">
          No version history yet — run the box to create one.
        </p>
      )}

      <p className="flex items-start gap-1.5 text-[11px] leading-snug text-ink-muted">
        <Icon name="alert" size={11} className="mt-[1px]" />
        <span>
          The AI rewrites the whole component, so the diff and the version history are the check — nothing is
          verified for you beyond the preview.
        </span>
      </p>
    </div>
  );
}

/** True when this box type supports AI change requests (used by BoxNode). */
export function supportsCodeChanges(data: BoxData | undefined): boolean {
  return !!data?.code;
}
