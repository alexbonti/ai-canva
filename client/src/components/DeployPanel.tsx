import { useState } from "react";
import { useBoardStore } from "../store/boardStore.js";
import type { BoxType } from "../types.js";
import { deployBlockedReason, deployFilesFor } from "../lib/deploy.js";
import { Button } from "./ui/Button.js";
import { Icon } from "./ui/Icon.js";

/**
 * The result of publishing a box's code to here.now, and the button to do it
 * again.
 *
 * Two things here are deliberate rather than cosmetic:
 *
 * - an anonymous Site **expires in 24 hours** and is updatable only with the claim
 *   token here.now returns EXACTLY ONCE, so the expiry and the claim link are
 *   surfaced instead of being buried in a state file;
 * - a redeploy updates the same Site and sends the last live version back, so a
 *   Site that changed elsewhere is refused with a clear message rather than
 *   silently replaced — that message is what `deploy.error` shows.
 *
 * Styling follows "The Printed Line": the live site is a printed ticket row —
 * small-caps caption, a mono URL on its own line, mono counts and timestamps —
 * with warnings and errors as tinted ruled strips, never as filled cards.
 */
export default function DeployPanel({ id, boxType }: { id: string; boxType: BoxType }) {
  const boxData = useBoardStore((s) => s.boxData[id]);
  const deployBox = useBoardStore((s) => s.deployBox);
  const [showClaim, setShowClaim] = useState(false);

  if (!boxData) return null;
  const deploy = boxData.deploy;
  const blocked = deployBlockedReason(boxType, boxData);
  const files = deployFilesFor(boxType, boxData);
  const isRunning = boxData.status === "running";
  // A failed attempt keeps the previous good record and still SHOWS the live site:
  // after a refused update the site is still up and reachable, and hiding it would
  // be the least useful moment to hide it.
  const failed = deploy?.error ? deploy.error : "";
  const live = deploy?.url ? (deploy as NonNullable<typeof deploy>) : null;
  const hasLive = Boolean(live);

  if (!deploy && !files.length) return null;

  return (
    <div className="mt-2 border-t border-rule">
      {/* Ticket strip — the site's state and the one action */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-rule bg-paper-raised px-2.5 py-2">
        <span className="label-caps inline-flex items-center gap-1 text-ink-muted">
          <Icon name="globe" size={11} />
          Live site
        </span>
        {live ? (
          <span className="data-mono text-ink-muted">
            {live.fileCount} file{live.fileCount === 1 ? "" : "s"} · {(live.bytes / 1024).toFixed(1)} KB ·{" "}
            {new Date(live.deployedAt).toLocaleString()}
          </span>
        ) : (
          <span className="data-mono text-ink-muted">{blocked || `${files.length} file(s) ready to publish`}</span>
        )}
        <Button
          variant="primary"
          size="xs"
          onClick={() => deployBox(id)}
          disabled={isRunning || Boolean(blocked)}
          className="ml-auto whitespace-nowrap"
          title={hasLive ? "Publish the current code to the same site" : "Publish this box's code to a live URL"}
          icon={<Icon name="globe" size={12} />}
        >
          {isRunning ? "Publishing…" : hasLive ? "Redeploy" : "Deploy"}
        </Button>
      </div>

      {failed && (
        <p className="flex items-start gap-1.5 border-b border-[rgba(179,58,43,0.20)] bg-[rgba(179,58,43,0.06)] px-2.5 py-1.5 text-[11px] leading-snug text-state-error">
          <Icon name="alert" size={12} className="mt-[1px]" />
          <span className="flex-1">
            {failed}
            {deploy?.url ? " The previous site is still live and unchanged." : ""}
          </span>
        </p>
      )}

      {live && (
        <div className="space-y-1.5 border-b border-rule px-2.5 py-2 last:border-b-0">
          {/* The URL is the one fact here: mono, on its own rule, selectable. */}
          <a
            href={live.url}
            target="_blank"
            rel="noreferrer"
            className="nodrag data-mono block select-all truncate font-medium text-pine hover:underline hover:decoration-signal hover:underline-offset-2"
            title={live.url}
          >
            {live.url}
          </a>
          <p className="text-[11px] leading-snug text-ink-muted">
            {live.anonymous ? (
              <>
                Anonymous site —{" "}
                <span className="data-mono text-state-stale">
                  {live.expiresAt ? `expires ${new Date(live.expiresAt).toLocaleString()}` : "expires in 24 hours"}
                </span>
                . Claim it to keep it permanently:
              </>
            ) : (
              "Permanent site, saved to the here.now account."
            )}
          </p>
          {live.anonymous && live.claimUrl && (
            <div className="space-y-1">
              <Button
                variant="secondary"
                size="xs"
                onClick={() => setShowClaim((v) => !v)}
                title="here.now returns this link only once — copy it before it is lost"
                icon={<Icon name="key" size={11} />}
              >
                {showClaim ? "Hide claim link" : "Show claim link"}
              </Button>
              {showClaim && (
                <div className="space-y-1">
                  <code className="nodrag data-mono block select-all break-all rounded-xs border border-rule bg-card px-1.5 py-1 text-ink-soft">
                    {live.claimUrl}
                  </code>
                  <p className="flex items-start gap-1.5 text-[11px] leading-snug text-state-stale">
                    <Icon name="alert" size={11} className="mt-[1px]" />
                    <span>
                      Returned once and cannot be recovered. Keep it if you want to update this site later —
                      a modified link will not work.
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}
          {live.warnings.length > 0 && (
            <ul className="space-y-1">
              {live.warnings.map((warning, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] leading-snug text-state-stale">
                  <Icon name="alert" size={11} className="mt-[1px]" />
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
