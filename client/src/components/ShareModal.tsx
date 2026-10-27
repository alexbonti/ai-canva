import { useState, useEffect, useRef } from "react";
import { useBoardStore } from "../store/boardStore.js";
import { useAuthStore } from "../store/authStore.js";
import { copyToClipboard } from "../lib/code.js";
import { Button } from "./ui/Button.js";
import { Icon } from "./ui/Icon.js";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
}

/** The one field recipe every dialog in "The Printed Line" uses. */
const FIELD =
  "w-full rounded-sm border border-rule bg-card px-2.5 text-[13px] text-ink " +
  "placeholder:text-ink-muted focus:outline-none focus:border-pine focus:ring-2 focus:ring-signal/30";

export default function ShareModal({ open, onClose }: ShareModalProps) {
  const currentBoardId = useBoardStore((s) => s.currentBoardId);
  const collaborators = useBoardStore((s) => s.collaborators);
  const shareBoard = useBoardStore((s) => s.shareBoard);
  const unshareBoard = useBoardStore((s) => s.unshareBoard);
  const user = useAuthStore((s) => s.user);

  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setEmail("");
      setCopied(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const isOwner = user && currentBoardId;
  const shareLink = currentBoardId
    ? window.location.origin + "/?board=" + currentBoardId
    : "";

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) return;
    if (collaborators.includes(trimmed)) return;
    if (user?.email === trimmed) return;
    shareBoard([trimmed]);
    setEmail("");
  };

  const handleRemove = (emailToRemove: string) => {
    unshareBoard(emailToRemove);
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(shareLink);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(22,33,28,0.45)] p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-md border border-rule bg-card shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-rule px-6 py-3.5">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">Share Board</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            title="Close"
            className="-mr-1 inline-flex h-7 w-7 items-center justify-center rounded-sm text-ink-muted transition-colors hover:bg-paper-raised hover:text-ink focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 py-5">
          {/* Share link */}
          <div>
            <label htmlFor="share-link" className="mb-1.5 block label-caps text-ink-muted">
              Share Link
            </label>
            <div className="flex gap-2">
              <input
                id="share-link"
                type="text"
                readOnly
                value={shareLink}
                className={
                  "h-8 min-w-0 flex-1 rounded-sm border border-rule bg-card px-2.5 " +
                  "font-mono text-[11px] text-ink focus:outline-none focus:border-pine " +
                  "focus:ring-2 focus:ring-signal/30"
                }
              />
              <Button
                variant="secondary"
                onClick={handleCopy}
                icon={<Icon name={copied ? "check" : "copy"} size={14} />}
                title="Copy the board link"
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="mt-1.5 text-[11px] leading-snug text-ink-muted">
              Anyone with this link who is logged in and has access can view and edit.
            </p>
          </div>

          {/* Add collaborator */}
          {isOwner && (
            <form onSubmit={handleAdd}>
              <label htmlFor="share-email" className="mb-1.5 block label-caps text-ink-muted">
                Add people by email
              </label>
              <div className="flex gap-2">
                <input
                  id="share-email"
                  ref={inputRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className={FIELD + " h-8 min-w-0 flex-1"}
                />
                <Button
                  type="submit"
                  variant="primary"
                  icon={<Icon name="plus" size={14} />}
                  title="Share this board with that email"
                >
                  Add
                </Button>
              </div>
            </form>
          )}

          {/* Collaborator list */}
          <div>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <span className="label-caps text-ink-muted">People with access</span>
              <span className="data-mono text-ink-muted">{collaborators.length + 1}</span>
            </div>
            <div className="border-t border-rule">
              {/* Owner */}
              <div className="flex items-center justify-between gap-3 border-b border-rule py-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    aria-hidden
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm border border-pine bg-pine text-[11px] font-semibold tracking-[0.02em] text-cream"
                  >
                    {(user?.email || "U").slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-mono text-[11.5px] text-ink">
                      {user?.email || "You"}
                    </div>
                    <div className="label-caps mt-0.5 text-ink-muted">Owner</div>
                  </div>
                </div>
              </div>
              {/* Collaborators */}
              {collaborators.map((emailAddr) => (
                <div
                  key={emailAddr}
                  className="flex items-center justify-between gap-3 border-b border-rule py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      aria-hidden
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm border border-rule bg-paper-raised text-[11px] font-semibold tracking-[0.02em] text-ink-soft"
                    >
                      {emailAddr.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-mono text-[11.5px] text-ink">
                        {emailAddr}
                      </div>
                      <div className="label-caps mt-0.5 text-ink-muted">Collaborator</div>
                    </div>
                  </div>
                  {isOwner && (
                    <Button
                      variant="danger"
                      size="xs"
                      onClick={() => handleRemove(emailAddr)}
                      title={`Remove ${emailAddr} from this board`}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              {collaborators.length === 0 && (
                <div className="flex items-center gap-2 border-b border-rule py-3 text-[11.5px] leading-snug text-ink-muted">
                  <Icon name="users" size={14} />
                  No collaborators yet — add people by email above.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-rule bg-paper-raised px-6 py-3">
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
