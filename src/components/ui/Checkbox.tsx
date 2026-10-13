import type { InputHTMLAttributes } from "react";
import { CheckIcon } from "@/components/icons";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> & {
  size?: "md" | "lg";
};

/** Native checkbox, restyled. Wrap it in a <label> so the whole row is the tap target. */
export function Checkbox({ size = "md", className = "", ...props }: CheckboxProps) {
  const box = size === "lg" ? "size-7" : "size-5.5";
  return (
    <span className="relative inline-grid shrink-0 place-items-center">
      <input
        type="checkbox"
        className={`peer ${box} appearance-none rounded-md border-2 border-text bg-surface checked:bg-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text ${className}`}
        {...props}
      />
      <CheckIcon
        size={size === "lg" ? 20 : 16}
        strokeWidth={3}
        className="pointer-events-none absolute text-surface opacity-0 peer-checked:opacity-100"
      />
    </span>
  );
}
