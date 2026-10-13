import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary";

const variants: Record<Variant, string> = {
  primary: "bg-text text-surface",
  secondary: "border border-border-strong bg-surface text-text",
};

/** Shared classes so links (e.g. "Generate grocery list") can look like buttons. */
export function buttonClasses(variant: Variant = "primary") {
  return `flex min-h-button w-full items-center justify-center rounded-card px-4 text-base font-semibold disabled:opacity-50 ${variants[variant]}`;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${buttonClasses(variant)} ${className}`}
      {...props}
    />
  );
}
