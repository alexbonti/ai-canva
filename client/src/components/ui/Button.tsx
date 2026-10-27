import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Shared button — the single source of truth for control styling in the app
 * chrome (header, sidebar, canvas tools, panels).
 *
 * "The Printed Line" system (see DESIGN.md):
 *  - `primary` is pine signage (the standard action);
 *  - `signal` is the one loud marigold action on a screen;
 *  - `bar` / `bar-ghost` are the quiet controls on the pine app bar;
 *  - everything else is card stock + a 1px hairline.
 * Every button keeps the same marigold keyboard focus ring.
 */
export type ButtonVariant =
  | "primary"
  | "signal"
  | "secondary"
  | "ghost"
  | "danger"
  | "bar"
  | "bar-ghost";
export type ButtonSize = "xs" | "sm" | "md";

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-pine text-cream border border-pine shadow-none " +
    "hover:bg-pine-deep hover:border-pine-deep",
  signal:
    "bg-signal text-signal-ink border border-signal font-semibold " +
    "hover:bg-signal-deep hover:border-signal-deep",
  secondary:
    "bg-card text-ink-soft border border-rule " +
    "hover:bg-paper-raised hover:border-rule-strong hover:text-ink",
  ghost:
    "bg-transparent text-ink-soft border border-transparent " +
    "hover:bg-paper-raised hover:text-ink",
  danger:
    "bg-card text-state-error border border-rule " +
    "hover:bg-error-wash hover:border-error-line",
  bar:
    "bg-transparent text-cream border border-[rgba(242,237,225,0.28)] " +
    "hover:bg-[rgba(242,237,225,0.10)] hover:border-[rgba(242,237,225,0.44)]",
  "bar-ghost":
    "bg-transparent text-[rgba(242,237,225,0.78)] border border-transparent " +
    "hover:bg-[rgba(242,237,225,0.10)] hover:text-cream",
};

/** On the pine bar a disabled control must stay dark, not become paper. */
const BAR_DISABLED =
  "disabled:bg-transparent disabled:border-transparent disabled:text-[rgba(242,237,225,0.45)]";

/** Pressed / toggled state (e.g. an open panel or active view). */
const ACTIVE: Record<ButtonVariant, string> = {
  primary: "bg-pine-deep border-pine-deep text-cream hover:bg-pine-deep",
  signal: "bg-signal-deep border-signal-deep text-signal-ink hover:bg-signal-deep",
  secondary: "bg-ink text-cream border-ink hover:bg-ink hover:border-ink hover:text-cream",
  ghost: "bg-ink text-cream border-ink hover:bg-ink hover:text-cream",
  danger: "bg-state-error border-state-error text-cream hover:bg-state-error",
  bar: "bg-[rgba(242,237,225,0.16)] border-[rgba(242,237,225,0.34)] text-cream hover:bg-[rgba(242,237,225,0.2)]",
  "bar-ghost":
    "bg-[rgba(242,237,225,0.16)] border-transparent text-cream hover:bg-[rgba(242,237,225,0.2)]",
};

const SIZE: Record<ButtonSize, string> = {
  xs: "h-7 px-2 text-[11.5px] gap-1.5 rounded-sm",
  sm: "h-8 px-2.5 text-[12.5px] gap-1.5 rounded-sm",
  md: "h-9 px-3.5 text-[13px] gap-2 rounded-sm",
};

const BASE =
  "inline-flex items-center justify-center font-medium whitespace-nowrap " +
  "transition-colors duration-150 select-none cursor-pointer " +
  "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal " +
  // A disabled control stays printed: it keeps its footprint but loses its ink,
  // instead of fading the whole element to a washed-out grey.
  "disabled:bg-paper-raised disabled:text-ink-muted disabled:border-rule " +
  "disabled:shadow-none disabled:cursor-not-allowed disabled:pointer-events-none";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Renders the pressed/toggled state (e.g. an open panel). */
  active?: boolean;
  /** Optional leading icon (see `components/ui/Icon.tsx`). */
  icon?: ReactNode;
}

export function Button({
  variant = "secondary",
  size = "sm",
  active = false,
  className = "",
  icon,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  const classes = [
    BASE,
    SIZE[size],
    active ? ACTIVE[variant] : VARIANT[variant],
    variant === "bar" || variant === "bar-ghost" ? BAR_DISABLED : "",
    className,
  ].join(" ");
  return (
    <button type={type} className={classes} {...rest}>
      {icon}
      {children}
    </button>
  );
}
