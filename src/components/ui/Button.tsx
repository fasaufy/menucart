import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "destructive" | "danger" | "quiet";
type Size = "lg" | "sm";

const variants: Record<Variant, string> = {
  primary: "border-2 border-accent-edge bg-accent-gradient font-semibold text-surface shadow-button",
  secondary: "border border-border bg-surface font-semibold text-text shadow-button",
  // White button with a red label ("Clear this meal").
  destructive: "border border-border bg-surface font-semibold text-day-strip shadow-button",
  danger: "border-2 border-[var(--danger-edge)] bg-danger-gradient font-semibold text-surface shadow-button",
  // Waiting states ("Resend in 0:42"): flat, no shadow.
  quiet: "bg-fill-disabled font-medium text-text-muted",
};

const sizes: Record<Size, string> = {
  lg: "min-h-button px-4 text-base",
  sm: "min-h-10 px-4 text-[0.9375rem]",
};

/** Shared classes so links (e.g. "Start shopping") can look like buttons. */
export function buttonClasses(variant: Variant = "primary", fullWidth = true, size: Size = "lg") {
  return `flex ${fullWidth ? "w-full" : "shrink-0"} items-center justify-center gap-1 rounded-pill text-center leading-tight transition-[filter,opacity] active:brightness-95 disabled:opacity-50 ${sizes[size]} ${variants[variant]}`;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  fullWidth?: boolean;
  size?: Size;
};

export function Button({
  variant = "primary",
  fullWidth = true,
  size = "lg",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${buttonClasses(variant, fullWidth, size)} ${className}`}
      {...props}
    />
  );
}
