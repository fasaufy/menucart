import type { ReactNode } from "react";

/**
 * Sticky bottom area for a screen's main action(s); content scrolling under
 * it fades out (design "Footer"). On Plan and List the tab bar goes inside it.
 * No backdrop blur: on a sticky layer it re-renders every scroll frame, which
 * stutters on mid-range Android phones; the opaque gradient hides the content anyway.
 */
export function Footer({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`sticky bottom-0 z-10 mt-auto flex flex-col gap-3 bg-footer-fade px-5 pt-8 pb-[calc(1.25rem+env(safe-area-inset-bottom))] ${className}`}
    >
      {children}
    </div>
  );
}
