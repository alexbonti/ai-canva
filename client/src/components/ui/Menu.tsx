import { useEffect, useRef, useState, type ReactNode } from "react";

import { Icon } from "./Icon.js";

/**
 * Minimal dropdown menu: a trigger render-prop plus an absolutely positioned
 * panel. Closes on outside click and on Escape — the same contract as the
 * presence roster popover. No portal: these menus live in the header, which
 * already sits high in the stacking order.
 *
 * Styling follows "The Printed Line": card stock, 1px hairline, one floating
 * paper shadow, mono captions.
 */
interface MenuProps {
  /** Render-prop receiving the trigger's toggle + open state. */
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  /**
   * Panel content. Pass a function `(close) => …` to let items close the
   * menu after acting (the usual behavior); a plain node keeps it open.
   */
  children: ReactNode | ((close: () => void) => ReactNode);
  /** Extra classes for the panel (e.g. a width: "w-72"). */
  panelClassName?: string;
  /** Align the panel's right edge to the trigger (default) or its left. */
  align?: "right" | "left";
}

export function Menu({ trigger, children, panelClassName = "w-64", align = "right" }: MenuProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
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

  const close = () => setOpen(false);

  return (
    <div ref={wrapRef} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          className={
            "absolute top-full mt-2 z-50 rounded-md bg-card " +
            "border border-rule shadow-float overflow-hidden " +
            (align === "right" ? "right-0 " : "left-0 ") +
            panelClassName
          }
        >
          {typeof children === "function" ? children(close) : children}
        </div>
      )}
    </div>
  );
}

/** A clickable row inside a Menu panel. */
interface MenuItemProps {
  icon?: ReactNode;
  label: ReactNode;
  description?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  /** Pine-tinted row for the primary action (e.g. "New board"). */
  accent?: boolean;
  /** Marks the currently-selected entry (e.g. the open board). */
  active?: boolean;
}

export function MenuItem({
  icon,
  label,
  description,
  onClick,
  danger,
  accent,
  active,
}: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors " +
        "focus:outline-none focus-visible:bg-paper-raised " +
        (danger
          ? "text-state-error hover:bg-error-wash"
          : accent
            ? "text-pine hover:bg-paper-raised"
            : "text-ink-soft hover:bg-paper-raised hover:text-ink") +
        (active ? " bg-paper-raised" : "")
      }
    >
      {icon !== undefined && (
        <span
          className={
            "w-4 flex items-center justify-center flex-shrink-0 " +
            (danger ? "" : accent ? "" : "text-ink-muted")
          }
        >
          {icon}
        </span>
      )}
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] font-medium truncate">{label}</span>
        {description && (
          <span className="block text-[11px] text-ink-muted truncate">{description}</span>
        )}
      </span>
      {active && <Icon name="check" size={12} className="flex-shrink-0 text-pine" />}
    </button>
  );
}

/** Thin separator inside a Menu panel. */
export function MenuDivider() {
  return <div className="h-px bg-rule my-1" />;
}

/** Muted uppercase caption inside a Menu panel. */
export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-3 pt-2 pb-1 label-caps text-ink-muted">
      {children}
    </div>
  );
}
