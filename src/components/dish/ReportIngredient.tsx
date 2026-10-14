"use client";

import { useState } from "react";
import { addReport } from "@/lib/db";
import type { Strings } from "@/lib/strings";
import type { Dish, Ingredient, ReportReason } from "@/lib/types";

const REASONS: ReportReason[] = ["wrong_ingredient", "wrong_amount", "halal_tag", "other"];

/** Inline "Report" for one library ingredient line. */
export function ReportIngredient({ dish, line, name, t }: { dish: Dish; line: Ingredient; name: string; t: Strings }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("wrong_ingredient");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  if (sent) return <p role="status" className="text-xs text-text-muted">{t.report.thanks}</p>;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="-my-2 min-h-tap self-end px-1 text-xs text-text-muted underline underline-offset-4"
      >
        {t.report.action}
      </button>
    );
  }

  return (
    <form
      className="flex flex-col gap-2 rounded-row bg-fill-muted p-3"
      onSubmit={async (e) => {
        e.preventDefault();
        await addReport({
          dishId: dish.id,
          dishName: dish.name,
          ingredientKey: line.key,
          ingredientName: line.name,
          reason,
          note: note.trim() || undefined,
        });
        setSent(true);
      }}
    >
      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-sm font-semibold">{t.report.title(name)}</legend>
        {REASONS.map((r) => (
          <label key={r} className="flex min-h-tap items-center gap-2.5 text-sm">
            <input
              type="radio"
              name={`report-${line.key}`}
              checked={reason === r}
              onChange={() => setReason(r)}
              className="size-5 accent-text"
            />
            {t.report.reasons[r]}
          </label>
        ))}
      </fieldset>
      <label htmlFor={`report-note-${line.key}`} className="text-meta text-text-muted">
        {t.report.note}
      </label>
      <input
        id={`report-note-${line.key}`}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="h-tap rounded-row border border-border-strong bg-surface px-3 text-body"
      />
      <div className="flex gap-2 pt-1">
        <button type="submit" className="min-h-tap flex-1 rounded-row bg-text text-sm font-semibold text-surface">
          {t.report.send}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="min-h-tap flex-1 rounded-row border border-border-strong bg-surface text-sm font-semibold"
        >
          {t.report.cancel}
        </button>
      </div>
    </form>
  );
}
