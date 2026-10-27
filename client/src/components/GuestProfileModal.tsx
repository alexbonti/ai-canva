import { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "./ui/Button.js";
import { Icon } from "./ui/Icon.js";

interface GuestProfileModalProps {
  teamName: string;
  workshopName: string;
  defaultName?: string;
  defaultEmail?: string;
  onSave: (name: string, email: string) => Promise<void>;
}

/** The one field recipe every dialog in "The Printed Line" uses. */
const FIELD =
  "w-full h-8 rounded-sm border border-rule bg-card px-2.5 text-[13px] text-ink " +
  "placeholder:text-ink-muted focus:outline-none focus:border-pine focus:ring-2 focus:ring-signal/30";

const LABEL = "mb-1.5 block label-caps text-ink-muted";

/**
 * Post-join profile step for workshop guests: they picked a team by code —
 * now they choose a display name (required) and may leave an email (optional,
 * never used for login; it only lets facilitators share boards with them).
 *
 * Not dismissible: the join is not finished until the profile is saved, so the
 * dialog has a header and body but no close control.
 */
export default function GuestProfileModal({
  teamName,
  workshopName,
  defaultName = "",
  defaultEmail = "",
  onSave,
}: GuestProfileModalProps) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Please pick a name so your team can see who you are.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(name.trim(), email.trim());
    } catch (err: any) {
      setError(err?.message || "Could not save your profile — try again.");
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(22,33,28,0.45)] p-4">
      <div className="w-full max-w-md overflow-hidden rounded-md border border-rule bg-card shadow-float">
        <div className="border-b border-rule px-6 py-4">
          <p className="label-caps text-ink-muted">Workshop guest</p>
          <h2 className="mt-1 text-[17px] font-semibold tracking-[-0.02em] text-ink">
            Welcome to {workshopName || "the workshop"}
          </h2>
          <p className="mt-1.5 text-[12.5px] leading-snug text-ink-soft">
            You're joining{" "}
            <span className="font-semibold text-ink">{teamName || "your team"}</span>. Tell your
            teammates who you are.
          </p>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <label htmlFor="guest-name" className={LABEL}>
              Your name
            </label>
            <input
              id="guest-name"
              autoFocus
              className={FIELD}
              placeholder="e.g. Alex"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <label htmlFor="guest-email" className="label-caps text-ink-muted">
                Email
              </label>
              <span className="text-[11px] text-ink-muted">optional · not used for login</span>
            </div>
            <input
              id="guest-email"
              type="email"
              className={FIELD}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="mt-1.5 text-[11px] leading-snug text-ink-muted">
              Leaving an email just makes it easier to share boards with you later.
            </p>
          </div>
          {error && (
            <p className="flex items-start gap-1.5 text-[11.5px] leading-snug text-state-error">
              <Icon name="alert" size={13} className="mt-px" />
              <span>{error}</span>
            </p>
          )}
        </div>

        <div className="border-t border-rule bg-paper-raised px-6 py-4">
          <Button
            variant="signal"
            size="md"
            onClick={handleSave}
            disabled={saving}
            className="w-full"
            icon={<Icon name="arrowRight" size={15} />}
          >
            {saving ? "Joining…" : "Join my team"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
