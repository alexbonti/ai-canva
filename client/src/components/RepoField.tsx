import type { BoxData } from "../types.js";
import { Icon } from "./ui/Icon.js";

/**
 * The repository field shared by the Code Map and Code Edit workers: the URL
 * input plus, after a run, exactly what was read (repo@branch · files · chars ·
 * capped · when) and the digest's notes. Showing this is what makes the box's
 * claims auditable instead of plausible.
 *
 * Styling follows "The Printed Line": a small-caps caption, a mono URL field and
 * a mono provenance line — all numbers, the branch and the timestamp in IBM Plex
 * Mono, and no second card inside the box.
 */
export default function RepoField({
  boxData,
  onChange,
  hint,
  children,
}: {
  boxData: BoxData;
  onChange: (url: string) => void;
  /** Extra one-liner under the field (the Code Edit box explains file targeting). */
  hint?: string;
  /** Rendered below the read summary (e.g. the change set). */
  children?: React.ReactNode;
}) {
  const meta = boxData.repoMeta;

  return (
    <div className="mb-2 rounded-md border border-rule bg-paper-raised px-2.5 py-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="label-caps inline-flex items-center gap-1 text-ink-muted">
          <Icon name="branch" size={11} />
          Repository
        </span>
        {(boxData.repoUrl || "").trim() === "" && (
          <span className="text-[11px] leading-snug text-ink-muted">
            (a GitHub link in a connected box works too)
          </span>
        )}
      </div>
      <input
        type="text"
        value={boxData.repoUrl || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://github.com/owner/repo  ·  owner/repo#branch"
        className="nodrag mt-1 h-8 w-full rounded-sm border border-rule bg-card px-2 font-mono text-[11px] text-ink placeholder:text-ink-muted"
        title="The public repository this box reads. Private repos need GITHUB_TOKEN on the server."
      />

      {hint && <p className="mt-1 text-[11px] leading-snug text-ink-muted">{hint}</p>}

      {meta && (
        <div className="mt-1.5 space-y-1">
          {meta.repo ? (
            <p className="data-mono leading-relaxed text-ink-muted">
              <span className="font-medium text-ink-soft">
                {meta.repo}
                {meta.branch ? `@${meta.branch}` : ""}
              </span>
              {" · "}
              <span>
                {meta.files} file{meta.files === 1 ? "" : "s"} of {meta.treeEntries}
              </span>
              {" · "}
              <span>{(meta.chars / 1000).toFixed(1)}k chars</span>
              {meta.truncated && <span className="font-medium text-state-stale">{" · "}capped</span>}
              {meta.fetchedAt > 0 && (
                <span>{" · "}read {new Date(meta.fetchedAt).toLocaleString()}</span>
              )}
            </p>
          ) : null}
          {meta.error && (
            <p className="flex items-start gap-1.5 text-[11px] leading-snug text-state-stale">
              <Icon name="alert" size={11} className="mt-[1px]" />
              <span className="flex-1">{meta.error}</span>
            </p>
          )}
          {meta.notes.length > 0 && (
            <details className="text-[11px] leading-snug text-ink-muted">
              <summary className="data-mono cursor-pointer select-none text-ink-muted">
                Repository notes ({meta.notes.length})
              </summary>
              <ul className="mt-1 space-y-0.5 pl-3">
                {meta.notes.map((note, i) => (
                  <li key={i} className="list-disc">
                    {note}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {children}
    </div>
  );
}
