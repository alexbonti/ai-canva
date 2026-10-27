import { useState } from "react";
import { useBoardStore } from "../store/boardStore.js";
import type { BoxData, BoxType } from "../types.js";
import {
  blockingFindings,
  gateState,
  latestVersion,
  sdlcStageMeta,
  upstreamBlockReason,
} from "../lib/sdlc.js";
import { Button } from "./ui/Button.js";
import { Icon } from "./ui/Icon.js";

/**
 * The approval gate of an SDLC stage box.
 *
 * Renders inside the box body (below the artifact) and owns its own store
 * subscriptions — the same pattern as the header — so a box re-render does not
 * have to push the whole board through props.
 *
 * Every action here is a HUMAN decision that lands in the box's audit trail:
 * approving records who and when, requesting changes sends the stage back with a
 * note the next regeneration must address, and editing appends a new version
 * instead of overwriting the old one.
 *
 * Styling follows "The Printed Line": a gate bar with one state chip, then ruled
 * sections (actions, findings, versions, audit trail) on paper-raised ground —
 * no nested cards, no coloured fills beyond a 10% state tint, and every count,
 * version and timestamp in mono.
 */
export default function SdlcGatePanel({ id, boxType }: { id: string; boxType: BoxType }) {
  const data = useBoardStore((s) => s.boxData[id]);
  const approveArtifact = useBoardStore((s) => s.approveArtifact);
  const requestChanges = useBoardStore((s) => s.requestChanges);
  const rejectArtifact = useBoardStore((s) => s.rejectArtifact);
  const editArtifact = useBoardStore((s) => s.editArtifact);
  const dismissFinding = useBoardStore((s) => s.dismissFinding);
  // Recomputes on board changes but only re-renders when the reason changes.
  const blockedReason = useBoardStore((s) => upstreamBlockReason(s.nodes, s.edges, s.boxData, id));

  const [noteOpen, setNoteOpen] = useState<"changes" | "reject" | null>(null);
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [viewVersion, setViewVersion] = useState<number | null>(null);

  if (!data) return null;
  const meta = sdlcStageMeta(boxType);
  if (!meta) return null;

  const versions = data.sdlcVersions || [];
  const latest = latestVersion(versions);
  const gate = gateState(boxType, data);
  const state = data.sdlcGate || "pending";
  const blocking = blockingFindings(data);
  const findings = data.sdlcFindings || [];

  /**
   * Chip styling per gate state — one state colour, a 10% tint, never a fill.
   * The label text is deliberately NOT uppercased: the gate's own name is read
   * as written in the audit trail ("Approved"), not shouted.
   */
  const chip =
    state === "approved"
      ? { className: "border-[rgba(46,125,79,0.28)] bg-[rgba(46,125,79,0.10)] text-state-ok", icon: "checkCircle" }
      : state === "rejected"
        ? { className: "border-[rgba(179,58,43,0.28)] bg-[rgba(179,58,43,0.10)] text-state-error", icon: "x" }
        : state === "stale"
          ? { className: "border-[rgba(154,106,0,0.28)] bg-[rgba(154,106,0,0.10)] text-state-stale", icon: "history" }
          : state === "changes_requested"
            ? { className: "border-[rgba(154,106,0,0.28)] bg-[rgba(154,106,0,0.10)] text-state-stale", icon: "rotate" }
            : { className: "border-rule bg-card text-ink-muted", icon: "clock" };

  const attentionChip =
    "inline-flex h-[18px] items-center gap-1 rounded-xs border px-1.5 data-mono font-medium " +
    "border-[rgba(154,106,0,0.28)] bg-[rgba(154,106,0,0.10)] text-state-stale";

  const submitNote = () => {
    if (noteOpen === "changes") requestChanges(id, note.trim());
    else if (noteOpen === "reject") rejectArtifact(id, note.trim());
    setNote("");
    setNoteOpen(null);
  };

  const startEditing = () => {
    setDraft(latest?.content || "");
    setEditing(true);
    setViewVersion(null);
  };

  const viewedVersion = viewVersion !== null ? versions.find((v) => v.version === viewVersion) : null;

  return (
    <div className="mt-2 border-t border-rule">
      {/* === Gate bar === */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-rule bg-paper-raised px-2.5 py-2">
        <span
          className={"inline-flex h-[18px] items-center gap-1 rounded-xs border px-1.5 data-mono font-medium " + chip.className}
          title={gate.reason || "This stage must be approved before the next stage can run."}
        >
          <Icon name={chip.icon} size={10} />
          {state === "approved" ? "Approved" : state === "pending" ? "Awaiting approval" : state === "changes_requested" ? "Changes requested" : state === "rejected" ? "Rejected" : "Stale"}
          {latest ? ` · v${latest.version}` : ""}
        </span>

        {state === "approved" && (
          <span className="data-mono truncate text-ink-muted" title={`Approved by ${data.sdlcApprovedBy || "someone"}`}>
            by {data.sdlcApprovedBy || "someone"}
            {data.sdlcApprovedAt ? ` · ${new Date(data.sdlcApprovedAt).toLocaleString()}` : ""}
          </span>
        )}

        {blocking.length > 0 && (
          <span
            className="inline-flex h-[18px] items-center gap-1 rounded-xs border border-[rgba(179,58,43,0.28)] bg-[rgba(179,58,43,0.10)] px-1.5 data-mono font-medium text-state-error"
            title="A blocking finding must be resolved or explicitly dismissed before this stage can be approved"
          >
            <Icon name="alert" size={10} />
            {blocking.length} blocking
          </span>
        )}

        {(data.sdlcOpenItems || []).length > 0 && (
          <span className={attentionChip} title="Open questions the artifact left unresolved">
            <Icon name="alert" size={10} />
            {(data.sdlcOpenItems || []).length} unresolved
          </span>
        )}

        {(data.sdlcGaps || []).length > 0 && (
          <span className={attentionChip} title="Spec decisions with no named test in the plan">
            <Icon name="alert" size={10} />
            {(data.sdlcGaps || []).length} decision{(data.sdlcGaps || []).length === 1 ? "" : "s"} untested
          </span>
        )}

        {data.sdlcDeviation && (
          <span className={attentionChip} title="The artifact reports a deviation from the approved plan">
            <Icon name="alert" size={10} />
            plan deviation
          </span>
        )}

        {versions.length > 0 && (
          <Button
            variant="secondary"
            size="xs"
            onClick={() => { setShowHistory((v) => !v); setViewVersion(null); }}
            className="ml-auto whitespace-nowrap"
            title="Show every version and the audit trail"
            icon={<Icon name="history" size={11} />}
          >
            {versions.length} version{versions.length === 1 ? "" : "s"}
          </Button>
        )}
      </div>

      {/* Blocked reason — the stage cannot run until this is resolved. */}
      {blockedReason && (
        <p className="flex items-start gap-1.5 border-b border-[rgba(179,58,43,0.20)] bg-[rgba(179,58,43,0.06)] px-2.5 py-1.5 text-[11px] leading-snug text-state-error">
          <Icon name="alert" size={12} className="mt-[1px]" />
          <span className="flex-1">{blockedReason}</span>
        </p>
      )}

      {/* Gate actions — one pine decision, then quiet secondaries. */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-rule px-2.5 py-2">
        <Button
          variant="primary"
          size="xs"
          onClick={() => approveArtifact(id)}
          disabled={!latest}
          title="Approve this artifact version — later stages can then run"
          icon={<Icon name="check" size={12} />}
        >
          Approve
        </Button>
        <Button
          variant="secondary"
          size="xs"
          onClick={() => { setNoteOpen(noteOpen === "changes" ? null : "changes"); setNote(data.sdlcFeedback || ""); }}
          disabled={!latest}
          title="Send this stage back with feedback — the next run must address it"
          icon={<Icon name="rotate" size={11} />}
        >
          Request changes
        </Button>
        <Button
          variant="danger"
          size="xs"
          onClick={() => { setNoteOpen(noteOpen === "reject" ? null : "reject"); setNote(""); }}
          disabled={!latest}
          title="Reject this artifact (all versions are kept)"
          icon={<Icon name="x" size={11} />}
        >
          Reject
        </Button>
        <Button
          variant="secondary"
          size="xs"
          active={editing}
          onClick={() => (editing ? setEditing(false) : startEditing())}
          disabled={!latest}
          title="Edit the artifact and save it as a new version"
          icon={<Icon name="codeedit" size={11} />}
        >
          Edit
        </Button>
      </div>

      {/* Change-request / rejection note */}
      {noteOpen && (
        <div className="space-y-1.5 border-b border-rule px-2.5 py-2">
          <textarea
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={noteOpen === "changes" ? "What must change? (sent into the next regeneration)" : "Why is this rejected?"}
            className="nodrag nowheel min-h-[54px] w-full resize-y rounded-sm border border-rule bg-card p-2 text-[11px] leading-snug text-ink placeholder:text-ink-muted"
          />
          <div className="flex gap-1.5">
            <Button variant="primary" size="xs" onClick={submitNote}>
              {noteOpen === "changes" ? "Send back" : "Confirm rejection"}
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => { setNoteOpen(null); setNote(""); }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Artifact editor — saving appends a version, it never overwrites one */}
      {editing && (
        <div className="space-y-1.5 border-b border-rule px-2.5 py-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="nodrag nowheel min-h-[140px] w-full resize-y rounded-sm border border-rule bg-card p-2 font-mono text-[11px] leading-snug text-ink"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant="primary"
              size="xs"
              onClick={() => { editArtifact(id, draft, "edited at the gate"); setEditing(false); }}
              disabled={!draft.trim() || draft === latest?.content}
              title="Append this text as a new version (the previous versions are kept)"
              icon={<Icon name="check" size={12} />}
            >
              Save as new version
            </Button>
            <Button variant="ghost" size="xs" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <span className="data-mono text-ink-muted">
              {latest ? `New version v${latest.version + 1}` : "New version v1"}
            </span>
          </div>
        </div>
      )}

      {/* Open questions — the app's own cross-checks */}
      {(data.sdlcOpenItems || []).length > 0 && (
        <div className="border-b border-rule px-2.5 py-2">
          <p className="label-caps mb-1 text-state-stale">Unresolved — this stage stays gated</p>
          <ul className="space-y-1">
            {(data.sdlcOpenItems || []).map((item, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] leading-snug text-ink-soft">
                <Icon name="alert" size={11} className="mt-[1px] text-state-stale" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(data.sdlcGaps || []).length > 0 && (
        <div className="border-b border-rule px-2.5 py-2">
          <p className="label-caps mb-1 text-state-stale">Spec decisions with no named test</p>
          <ul className="space-y-1">
            {(data.sdlcGaps || []).map((gap, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] leading-snug text-ink-soft">
                <Icon name="alert" size={11} className="mt-[1px] text-state-stale" />
                <span>{gap}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.sdlcDeviation && (
        <p className="flex items-start gap-1.5 border-b border-rule px-2.5 py-2 text-[11px] leading-snug text-ink-soft">
          <Icon name="alert" size={12} className="mt-[1px] text-state-stale" />
          <span>
            The artifact reports a deviation from the approved plan — resolve it or approve deliberately.
          </span>
        </p>
      )}

      {/* Review findings — ruled rows, severity as a mono chip */}
      {findings.length > 0 && (
        <div className="border-b border-rule px-2.5 py-2">
          <p className="label-caps mb-1 text-ink-muted">Findings ({findings.length})</p>
          <div className="divide-y divide-rule">
            {findings.map((f) => (
              <div key={f.id} className="flex items-start gap-2 py-1.5 first:pt-0 last:pb-0">
                <span
                  className={
                    "inline-flex h-[16px] flex-shrink-0 items-center rounded-xs border px-1 data-mono uppercase " +
                    (f.severity === "blocking"
                      ? "border-[rgba(179,58,43,0.28)] bg-[rgba(179,58,43,0.10)] text-state-error"
                      : f.severity === "important"
                        ? "border-[rgba(154,106,0,0.28)] bg-[rgba(154,106,0,0.10)] text-state-stale"
                        : "border-rule bg-card text-ink-muted")
                  }
                >
                  {f.severity}
                </span>
                <span className={"flex-1 text-[11px] leading-snug " + (f.dismissed ? "text-ink-muted line-through" : "text-ink-soft")}>
                  {f.description}
                  {f.location && <span className="data-mono text-ink-muted"> · {f.location}</span>}
                </span>
                {f.dismissed ? (
                  <span className="data-mono whitespace-nowrap text-ink-muted">
                    dismissed{f.dismissedBy ? ` · ${f.dismissedBy}` : ""}
                  </span>
                ) : (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => dismissFinding(id, f.id)}
                    className="flex-shrink-0 text-ink-muted"
                    title="Dismiss this finding (recorded in the audit trail)"
                  >
                    Dismiss
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {versions.length > 0 && findings.length === 0 && meta.stage === "review" && (
        <p className="border-b border-rule px-2.5 py-2 text-[11px] leading-snug text-state-stale">
          No structured findings could be parsed from this artifact — review it manually before approving.
        </p>
      )}

      {/* Version history + audit trail (old versions stay queryable) */}
      {showHistory && (
        <div className="border-b border-rule px-2.5 py-2">
          <p className="label-caps mb-1.5 text-ink-muted">Versions — nothing is ever overwritten</p>
          {versions.length === 0 && (
            <p className="text-[11px] leading-snug text-ink-muted">
              No version history yet — run the stage to create one.
            </p>
          )}
          <div>
            {versions.map((v) => (
              <div
                key={v.version}
                className="flex items-center gap-2 border-b border-rule py-1 text-[11px] last:border-b-0"
              >
                <span className="data-mono w-6 flex-shrink-0 font-medium text-ink-soft">v{v.version}</span>
                <span className="flex flex-shrink-0 items-center gap-1 whitespace-nowrap text-ink-muted">
                  <Icon name={v.source === "edited" ? "codeedit" : "wand"} size={10} />
                  {v.source === "edited" ? "edited" : "generated"}
                </span>
                <span className="truncate text-ink-soft" title={v.createdBy}>{v.createdBy}</span>
                <span className="data-mono flex-shrink-0 text-ink-muted">{new Date(v.createdAt).toLocaleString()}</span>
                <span className="flex-1" />
                <button
                  onClick={() => setViewVersion(viewVersion === v.version ? null : v.version)}
                  className="flex-shrink-0 whitespace-nowrap rounded-xs border border-rule bg-card px-1.5 py-0.5 text-[11px] text-ink-soft transition-colors hover:bg-paper-raised hover:text-ink"
                >
                  {viewVersion === v.version ? "hide" : "view"}
                </button>
                {latest?.version === v.version && (
                  <span className="inline-flex h-[16px] flex-shrink-0 items-center rounded-xs bg-[rgba(18,50,41,0.08)] px-1 data-mono text-pine">
                    latest
                  </span>
                )}
              </div>
            ))}
          </div>

          {viewedVersion && (
            <pre className="nodrag nowheel mt-1.5 max-h-40 overflow-auto rounded-sm border border-rule bg-card p-2 font-mono text-[11px] leading-snug text-ink-soft whitespace-pre-wrap">
              {viewedVersion.content}
            </pre>
          )}

          {(data.sdlcHistory || []).length > 0 && (
            <>
              <p className="label-caps mb-1 mt-2.5 text-ink-muted">Audit trail</p>
              <div>
                {[...(data.sdlcHistory || [])].reverse().map((e, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-baseline gap-x-1.5 border-b border-rule py-1 text-[11px] leading-snug last:border-b-0"
                  >
                    <span className="data-mono text-ink-muted">{new Date(e.at).toLocaleString()}</span>
                    <span className="text-rule-strong">—</span>
                    <span className="font-medium text-ink-soft">{e.actor}</span>
                    <span className="text-ink-soft">{e.action}</span>
                    {e.note && <span className="text-ink-muted">— {e.note}</span>}
                  </div>
                ))}
              </div>
            </>
          )}

          {data.sdlcFeedback && (
            <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-snug text-state-stale">
              <Icon name="rotate" size={11} className="mt-[1px]" />
              <span>Last change request at the gate: {data.sdlcFeedback}</span>
            </p>
          )}
        </div>
      )}

      {/* Gate configuration note — the toggle itself lives in the settings panel */}
      <p className="px-2.5 py-2 text-[11px] leading-snug text-ink-muted">
        {gate.locked
          ? `Always gated: ${gate.reason}`
          : gate.required
            ? "The next stage waits for your approval."
            : "Auto-advance: the next stage may run without an approval."}
      </p>
    </div>
  );
}

/**
 * Compact gate state badge for the box header, so the pipeline's state is
 * readable on the canvas without opening the box.
 */
export function SdlcGateBadge({ data }: { data: BoxData }) {
  const state = data.sdlcGate;
  const hasArtifact = (data.sdlcVersions || []).length > 0;
  if (!state && !hasArtifact) return null;

  const map: Record<string, { icon: string; className: string; title: string }> = {
    approved: {
      icon: "checkCircle",
      className: "border-[rgba(46,125,79,0.28)] bg-[rgba(46,125,79,0.10)] text-state-ok",
      title: "Artifact approved",
    },
    pending: {
      icon: "clock",
      className: "border-[rgba(154,106,0,0.28)] bg-[rgba(154,106,0,0.10)] text-state-stale",
      title: "Awaiting approval at the gate",
    },
    changes_requested: {
      icon: "rotate",
      className: "border-[rgba(154,106,0,0.28)] bg-[rgba(154,106,0,0.10)] text-state-stale",
      title: "Changes requested",
    },
    rejected: {
      icon: "x",
      className: "border-[rgba(179,58,43,0.28)] bg-[rgba(179,58,43,0.10)] text-state-error",
      title: "Rejected",
    },
    stale: {
      icon: "history",
      className: "border-[rgba(154,106,0,0.28)] bg-[rgba(154,106,0,0.10)] text-state-stale",
      title: "Stale — an upstream stage changed",
    },
  };
  const info = map[state || "pending"];

  return (
    <span
      className={"inline-flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-xs border " + info.className}
      title={info.title}
    >
      <Icon name={info.icon} size={11} />
    </span>
  );
}
