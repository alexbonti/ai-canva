import { useEffect, useRef, useState } from "react";
import { useBoardStore } from "../store/boardStore.js";
import { useAuthStore } from "../store/authStore.js";
import { groupRoster, type RosterEntry } from "../lib/presence.js";

/**
 * Header presence UI: a stack of coloured presence dots for everyone on the
 * board plus a "N online" pill. Clicking it opens the full roster — online
 * users (names, emails and a mono "you" chip) and, below, collaborators the
 * board is shared with who are not online right now. Shown whenever a board is
 * open, so the roster reads both as "only you" and as a live list.
 *
 * Styling: "The Printed Line" — a cream popover over the pine app bar, hairline
 * separators, 8px presence dots and small-caps captions.
 */
export default function PresenceRoster() {
  const activeUsers = useBoardStore((s) => s.activeUsers);
  const collaborators = useBoardStore((s) => s.collaborators);
  const currentUser = useAuthStore((s) => s.user);

  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const roster = groupRoster(activeUsers, collaborators, currentUser?.email || undefined);
  const shown = roster.online.slice(0, 4);
  const extra = roster.online.length - shown.length;

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        title="Who is on this board right now"
        className={
          "flex h-8 items-center gap-2 rounded-pill border pl-2 pr-2.5 text-cream transition-colors " +
          "focus:outline-none focus-visible:outline focus-visible:outline-2 " +
          "focus-visible:outline-offset-2 focus-visible:outline-signal " +
          (open
            ? "border-[rgba(242,237,225,0.44)] bg-[rgba(242,237,225,0.10)]"
            : "border-[rgba(242,237,225,0.28)] hover:border-[rgba(242,237,225,0.44)] hover:bg-[rgba(242,237,225,0.10)]")
        }
      >
        <span className="flex items-center -space-x-1">
          {shown.map((u) => (
            <span
              key={u.email}
              className="h-2 w-2 rounded-pill border border-pine"
              style={{ backgroundColor: u.color }}
              title={u.email}
            />
          ))}
          {extra > 0 && (
            <span className="data-mono pl-1.5 text-cream/70">+{extra}</span>
          )}
        </span>
        <span className="whitespace-nowrap text-[11px] font-medium text-cream/80">
          {roster.online.length} online
        </span>
      </button>

      {open && (
        <div
          data-testid="roster-popover"
          className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-md border border-rule bg-cream shadow-float"
        >
          <div className="flex items-start justify-between gap-3 border-b border-rule px-3.5 py-2.5">
            <div className="min-w-0">
              <p className="label-caps text-ink-muted">On this board now</p>
              <p className="mt-1 text-[11.5px] leading-snug text-ink-soft">
                {roster.online.length === 1
                  ? "Only you — share the board to collaborate."
                  : `${roster.online.length} people have this board open.`}
              </p>
            </div>
            <span className="data-mono text-ink-muted">{roster.online.length}</span>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {roster.online.map((u: RosterEntry) => (
              <div
                key={u.email}
                data-testid="roster-row"
                className="flex items-center gap-2.5 border-b border-rule px-3.5 py-2 last:border-b-0"
              >
                <span
                  className="h-2 w-2 flex-shrink-0 rounded-pill"
                  style={{ backgroundColor: u.color }}
                  title="Online"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-[12.5px] font-medium text-ink">{u.name}</span>
                    {u.isSelf && (
                      <span
                        data-testid="you-chip"
                        className="data-mono rounded-pill border border-rule bg-card px-1.5 py-px text-ink-muted"
                      >
                        you
                      </span>
                    )}
                  </span>
                  <span className="data-mono block truncate text-ink-muted">{u.email}</span>
                </span>
              </div>
            ))}

            {roster.offline.length > 0 && (
              <>
                <div className="flex items-baseline justify-between gap-2 border-b border-rule px-3.5 pb-1 pt-2">
                  <span className="label-caps text-ink-muted">Shared with · offline</span>
                  <span className="data-mono text-ink-muted">{roster.offline.length}</span>
                </div>
                {roster.offline.map((email) => (
                  <div
                    key={email}
                    className="flex items-center gap-2.5 border-b border-rule px-3.5 py-1.5 last:border-b-0"
                  >
                    <span
                      className="h-2 w-2 flex-shrink-0 rounded-pill border border-rule-strong bg-card"
                      title="Offline"
                    />
                    <span className="data-mono min-w-0 flex-1 truncate text-ink-soft">{email}</span>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="border-t border-rule bg-paper-raised px-3.5 py-2">
            <p className="text-[11px] leading-snug text-ink-muted">
              People appear here while they have the board open.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
