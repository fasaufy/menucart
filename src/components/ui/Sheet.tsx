"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { CloseIcon } from "@/components/icons";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
};

/**
 * Bottom sheet on a native modal <dialog>: focus trap, Escape to close and
 * an inert page behind come from the browser. Tapping the backdrop closes it.
 * Mark the element to focus on open with data-autofocus.
 */
export function Sheet({ open, onClose, labelledBy, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onClose={onClose}
      // The dialog box itself is only hit outside the inner panel: the backdrop.
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-x-0 top-auto bottom-0 m-0 mx-auto max-h-[92dvh] w-full max-w-app overflow-visible bg-transparent p-0 text-text backdrop:bg-[var(--scrim)]"
    >
      <div className="flex max-h-[92dvh] flex-col gap-4 overflow-y-auto rounded-t-sheet bg-[linear-gradient(to_bottom,var(--surface),var(--bg-top))] px-5 pt-3 pb-[calc(1.75rem+env(safe-area-inset-bottom))]">
        <div aria-hidden="true" className="h-1.5 w-10 shrink-0 self-center rounded-pill bg-border-strong/70" />
        {open && children}
      </div>
    </dialog>
  );
}

/** Round × in a sheet's title row. */
export function SheetClose({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-tap shrink-0 place-items-center rounded-pill bg-surface shadow-float"
    >
      <CloseIcon size={18} />
    </button>
  );
}
