import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/Button.js";
import { Icon } from "./ui/Icon.js";

interface NewBoardModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

/** The one field recipe every dialog in "The Printed Line" uses. */
const FIELD =
  "w-full h-8 rounded-sm border border-rule bg-card px-2.5 text-[13px] text-ink " +
  "placeholder:text-ink-muted focus:outline-none focus:border-pine focus:ring-2 focus:ring-signal/30";

export default function NewBoardModal({ open, onClose, onCreate }: NewBoardModalProps) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName("");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(name.trim() || "Untitled Board");
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
        <div className="flex items-center justify-between gap-3 border-b border-rule px-6 py-3.5">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">Create New Board</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            title="Close"
            className="-mr-1 inline-flex h-7 w-7 items-center justify-center rounded-sm text-ink-muted transition-colors hover:bg-paper-raised hover:text-ink focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5">
            <label htmlFor="new-board-name" className="mb-1.5 block label-caps text-ink-muted">
              Board Name
            </label>
            <input
              id="new-board-name"
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Startup Pitch Deck, Meal Planner App..."
              className={FIELD}
            />
            <p className="mt-1.5 text-[11px] leading-snug text-ink-muted">
              You can rename it any time from the board bar.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-rule bg-paper-raised px-6 py-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={<Icon name="plus" size={14} />}>
              Create Board
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
