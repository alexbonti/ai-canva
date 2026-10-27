import { lazy, Suspense, useState } from "react";
import { useBoardStore } from "../store/boardStore.js";
import type { BoxData, BoxType, FileChange } from "../types.js";
import { buildPatch, computeLineDiff, summarizeChangeSet } from "../lib/codeedit.js";
import RepoField from "./RepoField.js";
import { Button } from "./ui/Button.js";
import { Icon } from "./ui/Icon.js";

// The editor pulls in CodeMirror (~500KB), so it is only fetched when a file is
// actually opened for editing — same pattern as the Code box.
const CodeEditor = lazy(() => import("./CodeEditor.js"));

/**
 * The Code Edit worker's panel: repository + file targeting, then the proposed
 * change set as a reviewable diff you can fix by hand.
 *
 * The diff is computed from the whole-file content the model returned, so what
 * this panel shows IS what the downloaded `.patch` contains.
 *
 * Styling follows "The Printed Line": provenance is a mono ruled strip, the
 * change set is a ruled list with mono counts, and the diff is a pine-deep code
 * block whose added/removed lines carry the state-ok / state-error wash over
 * cream mono text.
 */
export default function CodeEditPanel({ id, boxType }: { id: string; boxType: BoxType }) {
  const boxData = useBoardStore((s) => s.boxData[id]);
  const updateBoxData = useBoardStore((s) => s.updateBoxData);
  const setChangeSetFile = useBoardStore((s) => s.setChangeSetFile);

  const [selected, setSelected] = useState<string | null>(null);
  const [mode, setMode] = useState<"diff" | "edit">("diff");

  if (!boxData) return null;

  const changeSet = boxData.changeSet || [];
  const totals = summarizeChangeSet(changeSet);
  const current: FileChange | undefined =
    changeSet.find((c) => c.path === selected) || changeSet[0];

  /** One diff-line tone: a state wash for changed lines, quiet cream for context. */
  const diffTone = (type: string) =>
    type === "+"
      ? "bg-[rgba(46,125,79,0.22)] text-cream"
      : type === "-"
        ? "bg-[rgba(179,58,43,0.24)] text-cream"
        : "text-[rgba(242,237,225,0.62)]";

  /** Operation chips — create is ok green, delete is error red, update neutral pine. */
  const operationTone = (change: FileChange) =>
    change.operation === "create"
      ? "border-[rgba(46,125,79,0.28)] bg-[rgba(46,125,79,0.10)] text-state-ok"
      : change.operation === "delete"
        ? "border-[rgba(179,58,43,0.28)] bg-[rgba(179,58,43,0.10)] text-state-error"
        : "border-[rgba(18,50,41,0.22)] bg-[rgba(18,50,41,0.06)] text-pine";

  return (
    <div className="space-y-2">
      <RepoField
        boxData={boxData}
        onChange={(url) => updateBoxData(id, { repoUrl: url })}
        hint="Describe the change below (or connect an Idea / Spec / Plan box). Files to change are taken from this list, then from an upstream Plan, otherwise chosen automatically."
      >
        <div className="mt-2">
          <label className="label-caps text-ink-muted">Files to change (optional)</label>
          <textarea
            value={boxData.filesToEdit || ""}
            onChange={(e) => updateBoxData(id, { filesToEdit: e.target.value })}
            placeholder={"one repository path per line\ne.g. server/src/app.ts"}
            className="nodrag nowheel mt-1 min-h-[46px] w-full resize-y rounded-sm border border-rule bg-card px-2 py-1 font-mono text-[11px] leading-snug text-ink placeholder:text-ink-muted"
          />
        </div>
      </RepoField>

      {/* Change request */}
      <textarea
        value={boxData.content}
        onChange={(e) => updateBoxData(id, { content: e.target.value })}
        placeholder="What should change in this repository? e.g. “rate-limit the SSO callback and add a test”"
        className="nodrag nowheel min-h-[56px] w-full resize-y rounded-sm border border-rule bg-card p-2 text-[12px] leading-snug text-ink placeholder:text-ink-muted"
      />

      {/* Provenance: how the targets were chosen and what was read */}
      {boxData.editMeta && (
        <div className="space-y-1 border-t border-rule pt-2">
          <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-[11px] leading-snug text-ink-muted">
            <span className="label-caps text-ink-muted">Files chosen</span>
            <span className="data-mono text-ink-soft">
              {boxData.editMeta.source === "pinned"
                ? "from the list above"
                : boxData.editMeta.source === "plan"
                  ? "from the upstream Plan"
                  : boxData.editMeta.source === "triage"
                    ? "chosen automatically from the repo tree"
                    : "none"}
            </span>
            {boxData.editMeta.read.length > 0 && (
              <span className="data-mono text-ink-muted">· read {boxData.editMeta.read.join(", ")}</span>
            )}
            {boxData.editMeta.generatedAt > 0 && (
              <span className="data-mono text-ink-muted">
                · {new Date(boxData.editMeta.generatedAt).toLocaleString()}
              </span>
            )}
          </p>
          {boxData.editMeta.missing.length > 0 && (
            <p className="flex items-start gap-1.5 text-[11px] leading-snug text-state-stale">
              <Icon name="alert" size={11} className="mt-[1px]" />
              <span>not readable (left untouched): {boxData.editMeta.missing.join(", ")}</span>
            </p>
          )}
          {boxData.editMeta.notes.length > 0 && (
            <ul className="space-y-0.5">
              {boxData.editMeta.notes.map((note, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] leading-snug text-state-stale">
                  <Icon name="alert" size={11} className="mt-[1px]" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* The change set */}
      {changeSet.length > 0 && (
        <div>
          {boxData.status === "error" && (
            <p className="flex items-start gap-1.5 border-t border-[rgba(154,106,0,0.28)] bg-[rgba(154,106,0,0.08)] px-2.5 py-1.5 text-[11px] leading-snug text-state-stale">
              <Icon name="alert" size={11} className="mt-[1px]" />
              <span>
                The change set below is from the previous successful run — this attempt failed, so it is
                not a proposal for the current request.
              </span>
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-y border-rule bg-paper-raised px-2.5 py-2">
            <span className="label-caps text-ink-muted">Change set</span>
            <span className="data-mono text-ink-muted">
              {totals.files} file{totals.files === 1 ? "" : "s"} ·{" "}
              <span className="font-medium text-state-ok">+{totals.added}</span>{" "}
              <span className="font-medium text-state-error">−{totals.removed}</span>
            </span>
            <span className="data-mono ml-auto inline-flex items-center gap-1 whitespace-nowrap text-ink-muted">
              <Icon name="download" size={10} />
              Save downloads .patch
            </span>
          </div>

          <div>
            {changeSet.map((change) => (
              <button
                key={change.path}
                onClick={() => setSelected(change.path)}
                aria-pressed={Boolean(current && current.path === change.path)}
                className={
                  "flex w-full items-center gap-2 border-b border-rule px-2.5 py-1.5 text-left transition-colors last:border-b-0 " +
                  (current && current.path === change.path
                    ? "bg-paper-raised"
                    : "hover:bg-paper-raised")
                }
              >
                <span
                  className={"inline-flex h-[16px] flex-shrink-0 items-center rounded-xs border px-1 data-mono uppercase " + operationTone(change)}
                >
                  {change.operation}
                </span>
                <span
                  className={
                    "min-w-0 flex-1 truncate font-mono text-[11px] " +
                    (current && current.path === change.path ? "text-ink" : "text-ink-soft")
                  }
                >
                  {change.path}
                </span>
                <span className="data-mono flex-shrink-0 whitespace-nowrap">
                  <span className="text-state-ok">+{change.added}</span>{" "}
                  <span className="text-state-error">−{change.removed}</span>
                </span>
              </button>
            ))}
          </div>

          {current && (
            <div className="border-t border-rule">
              <div className="flex flex-wrap items-center gap-1.5 px-2.5 py-1.5">
                <Button
                  variant="secondary"
                  size="xs"
                  active={mode === "diff"}
                  onClick={() => setMode("diff")}
                  icon={<Icon name="code" size={11} />}
                >
                  Diff
                </Button>
                <Button
                  variant="secondary"
                  size="xs"
                  active={mode === "edit"}
                  onClick={() => setMode("edit")}
                  icon={<Icon name="codeedit" size={11} />}
                >
                  Edit file
                </Button>
                <span className="flex-1" />
                {current.reason && (
                  <span className="max-w-[60%] truncate text-[11px] text-ink-muted" title={current.reason}>
                    {current.reason}
                  </span>
                )}
              </div>

              {mode === "diff" && (
                <pre className="nodrag nowheel max-h-64 overflow-auto border-y border-pine bg-pine-deep px-2.5 py-2 font-mono text-[11px] leading-[1.5] text-cream whitespace-pre">
                  {computeLineDiff(current.original, current.content).map((op, i) => (
                    <div key={i} className={diffTone(op.type)}>
                      {op.type + op.line}
                    </div>
                  ))}
                </pre>
              )}

              {mode === "edit" && (
                <div className="border-t border-rule p-1.5">
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center gap-1.5 py-3 text-[11px] text-ink-muted">
                        <Icon name="loader" size={12} className="animate-spin" />
                        Loading editor…
                      </div>
                    }
                  >
                    <CodeEditor
                      value={current.content}
                      onChange={(next) => setChangeSetFile(id, current.path, next)}
                      height="260px"
                    />
                  </Suspense>
                  <p className="mt-1 flex items-start gap-1.5 text-[11px] leading-snug text-ink-muted">
                    <Icon name="codeedit" size={11} className="mt-[1px]" />
                    <span>Edits recompute the diff — the .patch always matches what you see here.</span>
                  </p>
                </div>
              )}
            </div>
          )}

          <p className="border-t border-rule px-2.5 py-2 text-[11px] leading-snug text-ink-muted">
            Nothing was pushed anywhere: apply the patch in your checkout with{" "}
            <code className="whitespace-nowrap rounded-xs border border-rule bg-paper-raised px-1 font-mono text-[11px] text-ink-soft">
              git apply code-changes.patch
            </code>
            , or paste a file's contents. Nothing here has been compiled or tested — CI and the Review stage
            are where that happens.
          </p>
        </div>
      )}

      {/* A run that produced no change still has to say why */}
      {changeSet.length === 0 && boxData.status === "done" && boxData.editMeta?.error === "" && (
        <p className="flex items-start gap-1.5 border-t border-rule pt-2 text-[11px] leading-snug text-state-stale">
          <Icon name="alert" size={12} className="mt-[1px]" />
          <span>
            No change was proposed.{" "}
            {boxData.editMeta?.notes[0] || "See the box's output for the model's reasoning."}
          </span>
        </p>
      )}

      {/* Nothing to show yet */}
      {changeSet.length === 0 && boxData.status !== "done" && (
        <p className="border-t border-rule pt-2 text-[11px] leading-snug text-ink-muted">
          No change set yet. Give it a repository and a change request, then press{" "}
          <strong className="font-semibold text-ink-soft">Run</strong>.
        </p>
      )}
    </div>
  );
}

/** The patch text a Code Edit box would download (also used by the footer). */
export function boxPatch(boxData: BoxData | undefined): string {
  return buildPatch(boxData?.changeSet);
}
