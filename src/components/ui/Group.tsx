import type { HTMLAttributes, ReactNode } from "react";

// The design's grouped card: a tinted tray (20px radius, 4px padding) with a
// header line and one or more white cards inside.

export function Group({ className = "", children, ...props }: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <section className={`flex flex-col gap-1 rounded-group bg-group p-1 shadow-group ${className}`} {...props}>
      {children}
    </section>
  );
}

/** Title row inside a Group, above its cards. */
export function GroupHeader({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`flex min-h-tap items-center justify-between gap-3 px-3.5 py-3 ${className}`}>{children}</div>;
}

/** White card inside a Group. Rows inside it are split by dashed lines (see `rowDivider`). */
export function Card({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={`flex flex-col rounded-card bg-surface px-3.5 py-3 shadow-card ${className}`} {...props}>
      {children}
    </div>
  );
}

/** Dashed rule between rows in a Card: put it on every row but the first. */
export const rowDivider = "border-t border-dashed border-divider";
