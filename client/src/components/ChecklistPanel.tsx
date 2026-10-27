import { useMemo, useRef, useState } from "react";
import type { ChecklistItem } from "../types.js";
import {
  MAX_CHECKLIST_ITEMS,
  appendChecklistItems,
  checklistDisplayName,
  checklistStats,
  checklistToMarkdown,
  clearDoneChecklistItems,
  moveChecklistItem,
  normalizeChecklist,
  removeChecklistItem,
  setChecklistItemAssignee,
  setChecklistItemText,
  toggleChecklistItem,
} from "../lib/checklist.js";
import { useBoardStore } from "../store/boardStore.js";
import { useAuthStore } from "../store/authStore.js";
import { Button } from "./ui/Button.js";
import { Icon } from "./ui/Icon.js";
import { LINE_COLORS } from "../lib/lines.js";

interface ChecklistPanelProps {
  boxId: string;
  /** The raw stored tasks (normalized here — old boards load cleanly). */
  items: ChecklistItem[] | undefined;
}

/**
 * The body of a Checklist box — the team's shared to-do list.
 *
 * Rendering only: every rule (add/parse, toggle with attribution, assign,
 * rename, reorder, clear done, caps) is a pure function in
 * `client/src/lib/checklist.ts` and is unit-tested there. The panel wires those
 * functions to `setChecklistItems`, which writes through the normal debounced
 * board save — so a tick by one teammate reaches everyone through Firestore.
 *
 * This component owns its own store subscriptions: BoxNode must not subscribe
 * to collaborators/presence (that would re-render every box on the canvas
 * whenever someone moves their cursor).
 *
 * Styling follows "The Printed Line": a ruled timetable of tasks — hairline
 * rows, a 16px square check, mono assignee chips and progress figures, and a
 * marigold focus ring from the global rule. The class names the touch CSS
 * targets (`.checklist-check`, `.checklist-row-actions`, `.checklist-assign`,
 * `.checklist-add-input`, `.checklist-add-btn`) are kept on the same elements.
 */
export default function ChecklistPanel({ boxId, items }: ChecklistPanelProps) {
  const setChecklistItems = useBoardStore((s) => s.setChecklistItems);
  const me = useAuthStore((s) => s.user?.email || "");
  // Selected as a joined STRING: a fresh array from the selector would re-render
  // the panel on every presence snapshot while someone moves their mouse.
  const peopleKey = useBoardStore((s) => {
    // Dedupe case-insensitively but keep the first spelling seen (so the value
    // stored on a task always matches an option's value exactly).
    const seen = new Map<string, string>();
    const add = (email?: string | null) => {
      const clean = (email || "").trim();
      if (clean && !seen.has(clean.toLowerCase())) seen.set(clean.toLowerCase(), clean);
    };
    add(me);
    for (const email of s.collaborators || []) add(email);
    for (const u of s.activeUsers || []) add(u.email);
    return Array.from(seen.values()).sort().join("|");
  });
  const people = useMemo(() => (peopleKey ? peopleKey.split("|") : []), [peopleKey]);

  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const list = useMemo(() => normalizeChecklist(items), [items]);
  const stats = checklistStats(list);
  const full = list.length >= MAX_CHECKLIST_ITEMS;

  /** Applies a pure mutation to the shared list. */
  const mutate = (fn: (current: ChecklistItem[]) => ChecklistItem[]) => {
    setChecklistItems(boxId, fn(list));
  };

  const addDraft = (text: string) => {
    const next = appendChecklistItems(list, text, me);
    setChecklistItems(boxId, next);
    return next.length - list.length;
  };

  const submitDraft = () => {
    if (addDraft(draft) > 0) {
      setDraft("");
      // Keep the caret in the field so a whole list can be typed Enter-by-Enter.
      inputRef.current?.focus();
    }
  };

  const startEditing = (item: ChecklistItem) => {
    setEditingId(item.id);
    setEditDraft(item.text);
  };

  const commitEdit = () => {
    if (editingId) mutate((current) => setChecklistItemText(current, editingId, editDraft));
    setEditingId(null);
  };

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(checklistToMarkdown(list));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="checklist-panel nodrag flex h-full flex-col gap-2" data-testid="checklist-panel">
      {/* Progress + list-level actions */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <span className="checklist-progress data-mono text-ink-muted">
            {stats.total === 0 ? "0 tasks" : `${stats.done} of ${stats.total} done`}
          </span>
          <div className="flex items-center gap-0.5">
            {stats.done > 0 && (
              <Button
                variant="ghost"
                size="xs"
                className="checklist-clear-done font-medium text-ink-muted"
                title={`Remove the ${stats.done} finished task${stats.done === 1 ? "" : "s"}`}
                onClick={() => mutate((current) => clearDoneChecklistItems(current))}
                icon={<Icon name="trash" size={11} />}
              >
                Clear done
              </Button>
            )}
            <Button
              variant="ghost"
              size="xs"
              className="checklist-copy font-medium text-ink-muted"
              title="Copy the list as a Markdown checklist"
              onClick={copyMarkdown}
              disabled={stats.total === 0}
              icon={<Icon name={copied ? "check" : "copy"} size={11} />}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
        {/* Progress: one printed rule, filled in the category line colour.
            Not rendered at all for an empty list — a 0% rule is noise. */}
        {stats.total > 0 && (
          <div
            className="mt-1.5 h-[3px] overflow-hidden rounded-pill bg-rule"
            title={`${stats.percent}% complete`}
          >
            <div
              className="h-full rounded-pill transition-[width] duration-300"
              style={{ width: `${stats.percent}%`, backgroundColor: LINE_COLORS.collab }}
            />
          </div>
        )}
      </div>

      {/* Add a task — multi-line pastes become several tasks at once. */}
      <div className="flex flex-shrink-0 items-center gap-1.5">
        <input
          ref={inputRef}
          className="checklist-add-input nodrag h-8 min-w-0 flex-1 rounded-sm border border-rule bg-card px-2 text-[12px] text-ink placeholder:text-ink-muted disabled:opacity-45"
          placeholder={full ? "List is full" : "Add a task…"}
          value={draft}
          disabled={full}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submitDraft();
            }
            if (e.key === "Escape") setDraft("");
          }}
          onPaste={(e) => {
            const text = e.clipboardData?.getData("text") || "";
            // A pasted list (Markdown tasks, bullets, plain lines) imports in
            // one gesture instead of landing as one long task.
            if (!/\r?\n/.test(text.trim())) return;
            e.preventDefault();
            if (addDraft(text) > 0) setDraft("");
          }}
        />
        <Button
          variant="primary"
          size="xs"
          className="checklist-add-btn flex-shrink-0"
          disabled={!draft.trim() || full}
          onClick={submitDraft}
          title="Add the task (or paste a whole list)"
          icon={<Icon name="plus" size={12} />}
        >
          Add
        </Button>
      </div>

      {/* The shared list — ruled rows, no cards inside the card. */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {list.length === 0 && (
          <p className="checklist-empty border-t border-rule px-1 py-3 text-[11px] leading-snug text-ink-muted">
            Add the first task above — everyone on this board sees this list.
          </p>
        )}
        {list.map((item, index) => (
          <div
            key={item.id}
            data-testid="checklist-item"
            data-item-id={item.id}
            data-done={item.done ? "true" : "false"}
            className="checklist-item group flex items-start gap-2 border-b border-rule px-1 py-1.5 last:border-b-0"
          >
            <input
              type="checkbox"
              className="checklist-check nodrag mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer rounded-xs border border-rule-strong accent-pine"
              checked={item.done}
              onChange={() => mutate((current) => toggleChecklistItem(current, item.id, me))}
              title={item.done ? "Put this task back" : "Tick this task off"}
            />
            <div className="min-w-0 flex-1">
              {editingId === item.id ? (
                <input
                  autoFocus
                  className="nodrag w-full rounded-xs border border-rule-strong bg-card px-1 py-0.5 text-[12px] text-ink"
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                />
              ) : (
                <span
                  className={
                    "checklist-text block cursor-text break-words text-[12px] leading-snug " +
                    (item.done ? "text-ink-muted line-through" : "text-ink-soft")
                  }
                  title={`Added by ${checklistDisplayName(item.createdBy) || "someone"} — click to edit`}
                  onClick={() => startEditing(item)}
                >
                  {item.text}
                </span>
              )}
              <div className="mt-1 flex items-center gap-2">
                <select
                  className={
                    "checklist-assign nodrag h-[18px] max-w-[130px] rounded-pill border px-1.5 data-mono transition-colors " +
                    (item.assignee
                      ? "border-[rgba(18,50,41,0.22)] bg-[rgba(18,50,41,0.06)] text-pine"
                      : "border-rule bg-card text-ink-muted")
                  }
                  value={item.assignee}
                  onChange={(e) =>
                    mutate((current) => setChecklistItemAssignee(current, item.id, e.target.value))
                  }
                  title="Assign this task to a teammate on this board"
                >
                  <option value="">assign</option>
                  {people.map((email) => (
                    <option key={email} value={email}>
                      {checklistDisplayName(email)}
                    </option>
                  ))}
                  {/* Keep an assignee who is no longer listed (left the board) selectable. */}
                  {item.assignee && !people.includes(item.assignee) && (
                    <option value={item.assignee}>{checklistDisplayName(item.assignee)}</option>
                  )}
                </select>
                {/* The ticker is only worth printing when it differs from the
                    assignee — otherwise the row repeats the same name twice. */}
                {item.done && item.doneBy && item.doneBy !== item.assignee && (
                  <span className="checklist-done-by inline-flex items-center gap-1 data-mono text-ink-muted">
                    <Icon name="check" size={9} />
                    {checklistDisplayName(item.doneBy)}
                  </span>
                )}
              </div>
            </div>
            {/* Row actions stay out of the way until the row is hovered (always
                visible on touch devices via .touch-visible). */}
            <div className="checklist-row-actions touch-visible flex flex-shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
              <button
                className="checklist-move flex h-5 w-5 items-center justify-center rounded-xs text-ink-muted transition-colors hover:bg-paper-raised hover:text-ink disabled:opacity-30"
                title="Move up"
                disabled={index === 0}
                onClick={() => mutate((current) => moveChecklistItem(current, item.id, -1))}
              >
                <Icon name="chevronDown" size={12} className="rotate-180" />
              </button>
              <button
                className="checklist-move flex h-5 w-5 items-center justify-center rounded-xs text-ink-muted transition-colors hover:bg-paper-raised hover:text-ink disabled:opacity-30"
                title="Move down"
                disabled={index === list.length - 1}
                onClick={() => mutate((current) => moveChecklistItem(current, item.id, 1))}
              >
                <Icon name="chevronDown" size={12} />
              </button>
              <button
                className="checklist-delete flex h-5 w-5 items-center justify-center rounded-xs text-ink-muted transition-colors hover:bg-error-wash hover:text-state-error"
                title="Delete this task"
                onClick={() => mutate((current) => removeChecklistItem(current, item.id))}
              >
                <Icon name="trash" size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
