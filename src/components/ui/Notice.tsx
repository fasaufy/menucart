import type { ReactNode } from "react";

/** Warm card with a title, a line of detail and its actions ("Plan changed", "This list is from last week"). */
export function Notice({ title, detail, label, children }: { title: string; detail: string; label?: string; children: ReactNode }) {
  return (
    <div role="region" aria-label={label ?? title} className="flex flex-col gap-1 rounded-sheet bg-notice p-1 shadow-float">
      <div className="flex flex-col gap-0.5 p-4">
        <p className="font-display text-base leading-tight font-semibold">{title}</p>
        <p className="text-meta text-text-muted">{detail}</p>
      </div>
      <div className="flex flex-col gap-2 px-2 pb-2">{children}</div>
    </div>
  );
}
