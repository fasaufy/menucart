"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { inputClasses } from "@/components/ui/Input";
import { radioClasses } from "@/components/ui/Radio";
import { addReport } from "@/lib/db";
import type { Strings } from "@/lib/strings";
import type { Dish, Ingredient, ReportReason } from "@/lib/types";

const REASONS: ReportReason[] = ["wrong_ingredient", "wrong_amount", "halal_tag", "other"];

/** "Report" form for one library ingredient line; the editor shows the Report link. */
export function ReportIngredient({
  dish,
  line,
  name,
  t,
  onClose,
}: {
  dish: Dish;
  line: Ingredient;
  name: string;
  t: Strings;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<ReportReason>("wrong_ingredient");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  if (sent) return <p role="status" className="text-xs text-text-muted">{t.report.thanks}</p>;

  return (
    <form
      className="flex flex-col gap-2 rounded-xl bg-group p-3"
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
              className={radioClasses}
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
        className={inputClasses}
      />
      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" className="flex-1">
          {t.report.send}
        </Button>
        <Button variant="secondary" size="sm" className="flex-1" onClick={onClose}>
          {t.report.cancel}
        </Button>
      </div>
    </form>
  );
}
