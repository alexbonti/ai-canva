import { useState } from "react";
import { createPortal } from "react-dom";
import {
  CUSTOM_BOX_COLORS,
  CUSTOM_BOX_EMOJIS,
  DEFAULT_CUSTOM_COLOR,
  DEFAULT_CUSTOM_ICON,
  validateCustomBoxDraft,
  type CustomBoxDraft,
} from "../lib/customBoxes.js";
import { useUserBoxesStore } from "../store/userBoxesStore.js";
import { Button } from "./ui/Button.js";
import { Icon } from "./ui/Icon.js";

/** The one field recipe every dialog in "The Printed Line" uses. */
const FIELD =
  "w-full rounded-sm border border-rule bg-card px-2.5 text-[13px] text-ink " +
  "placeholder:text-ink-muted focus:outline-none focus:border-pine focus:ring-2 focus:ring-signal/30";

const LABEL = "mb-1.5 block label-caps text-ink-muted";

const HINT = "text-[11px] leading-snug text-ink-muted";

/**
 * "Create Custom Box" dialog: names a reusable AI box template, picks an
 * emoji + color, and writes the prompt/systemPrompt templates. Saved to the
 * user's profile (users/{uid}/boxes) so it appears in their palette on every
 * board. Rendered via a portal to document.body.
 *
 * The emoji picker is the user's own custom-box icon (user content), so it
 * keeps emoji; every piece of dialog chrome is the shared icon set.
 */
export default function CustomBoxModal({ onClose }: { onClose: () => void }) {
  const createDef = useUserBoxesStore((s) => s.create);

  const [label, setLabel] = useState("");
  const [icon, setIcon] = useState(DEFAULT_CUSTOM_ICON);
  const [color, setColor] = useState(DEFAULT_CUSTOM_COLOR);
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const draft: CustomBoxDraft = { label, icon, color, description, prompt, systemPrompt };

  const handleSave = async () => {
    const problems = validateCustomBoxDraft(draft);
    if (problems.length > 0) {
      setErrors(problems);
      return;
    }
    setSaving(true);
    try {
      await createDef(draft);
      onClose();
    } catch (err) {
      setErrors(["Could not save the box — check your connection and try again."]);
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(22,33,28,0.45)] p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-md border border-rule bg-card shadow-float">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-rule px-6 py-3.5">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em] text-ink">
            <Icon name="custom" size={16} className="text-line-custom" />
            Create a Custom Box
          </h2>
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
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <p className="-mt-1 text-[11.5px] leading-snug text-ink-muted">
            Your own reusable AI box — saved to your profile and available on every board.
          </p>

          {/* Name + icon */}
          <div className="flex items-end gap-3">
            <div className="min-w-0 flex-1">
              <label htmlFor="custom-box-name" className={LABEL}>
                Name
              </label>
              <input
                id="custom-box-name"
                autoFocus
                className={FIELD + " h-8"}
                placeholder="e.g. Translate to French"
                value={label}
                maxLength={40}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border text-lg"
              style={{ borderColor: color, backgroundColor: color + "14" }}
              title="Preview"
            >
              {icon}
            </div>
          </div>

          {/* Icon picker — the user's own custom-box emoji (user content). */}
          <div>
            <span className={LABEL}>Icon</span>
            <div className="flex flex-wrap gap-2">
              {CUSTOM_BOX_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setIcon(e)}
                  aria-pressed={icon === e}
                  aria-label={`Use ${e} as this box's icon`}
                  className={
                    "flex h-8 w-8 items-center justify-center rounded-sm border text-base transition-colors " +
                    "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal " +
                    (icon === e
                      ? "border-pine bg-paper-raised ring-2 ring-signal ring-offset-2 ring-offset-card"
                      : "border-rule bg-card hover:border-rule-strong hover:bg-paper-raised")
                  }
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <span className={LABEL}>Color</span>
            <div className="flex flex-wrap gap-2">
              {CUSTOM_BOX_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-pressed={color === c}
                  aria-label={`Use ${c} as this box's color`}
                  className={
                    "h-5 w-5 rounded-pill border transition " +
                    "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal " +
                    (color === c
                      ? "border-pine ring-2 ring-signal ring-offset-2 ring-offset-card"
                      : "border-rule hover:ring-2 hover:ring-rule")
                  }
                  style={{ backgroundColor: c }}
                  title="Box color"
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <label htmlFor="custom-box-description" className="label-caps text-ink-muted">
                Description
              </label>
              <span className="text-[11px] text-ink-muted">optional</span>
            </div>
            <input
              id="custom-box-description"
              className={FIELD + " h-8"}
              placeholder="What does this box do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Prompt template */}
          <div>
            <label htmlFor="custom-box-prompt" className={LABEL}>
              Prompt template
            </label>
            <textarea
              id="custom-box-prompt"
              className={
                FIELD +
                " min-h-[90px] resize-y py-2 font-mono text-[11.5px] leading-[1.5]"
              }
              placeholder={"What the AI should do. Use connected inputs:\n\nTranslate the following to French:\n{{input_1}}"}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <p className={"mt-1 " + HINT}>
              Supports <span className="font-mono">{"{{input_1}}"}</span>,{" "}
              <span className="font-mono">{"{{Box Name}}"}</span>,{" "}
              <span className="font-mono">{"{{inputs}}"}</span> — just like the built-in boxes.
            </p>
          </div>

          {/* System prompt */}
          <div>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <label htmlFor="custom-box-system" className="label-caps text-ink-muted">
                System prompt
              </label>
              <span className="text-[11px] text-ink-muted">the AI's role</span>
            </div>
            <textarea
              id="custom-box-system"
              className={
                FIELD +
                " min-h-[60px] resize-y py-2 text-[12.5px] leading-[1.5]"
              }
              placeholder="e.g. You are a professional translator. Reply only with the translation."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
            />
          </div>

          {errors.length > 0 && (
            <div className="rounded-sm border border-error-line bg-error-wash px-3 py-2">
              {errors.map((e) => (
                <p
                  key={e}
                  className="flex items-start gap-1.5 py-0.5 text-[11.5px] leading-snug text-state-error"
                >
                  <Icon name="alert" size={13} className="mt-px" />
                  <span>{e}</span>
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-rule bg-paper-raised px-6 py-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save to my profile"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
