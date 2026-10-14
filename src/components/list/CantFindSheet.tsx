"use client";

import { useState } from "react";
import { CloseIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { ALTERNATIVES } from "@/lib/dishes/alternatives";
import { replacementLines } from "@/lib/dishes/swaps";
import { replaceItem, setItemState } from "@/lib/list/actions";
import type { Strings } from "@/lib/strings";
import type { Ingredient, Language, ListItem } from "@/lib/types";
import { amountLines, formatQty, itemNames, usesText } from "./format";

type Props = {
  item: ListItem | null;
  weekId: string;
  t: Strings;
  language: Language;
  onClose: () => void;
};

/** Wireframe 08: 1–3 halal-safe alternatives; choosing one replaces the line. Works offline. */
export function CantFindSheet({ item, weekId, t, language, onClose }: Props) {
  return (
    <Sheet open={!!item} onClose={onClose} labelledBy="cant-find-title">
      {item && <Body key={item.key} item={item} weekId={weekId} t={t} language={language} onClose={onClose} />}
    </Sheet>
  );
}

function Body({ item, weekId, t, language, onClose }: Props & { item: ListItem }) {
  const options = ALTERNATIVES.get(item.key) ?? [];
  const [choice, setChoice] = useState(0);
  const name = itemNames(item, language).primary;
  // Alternatives scale from the list amount (already merged, in base units).
  const base: Ingredient = { ...item, qty: item.amounts[0]?.qty ?? 1, unit: item.amounts[0]?.unit ?? "pcs" };
  const label = (i: Ingredient) => (language === "id" ? (i.localName ?? i.name) : i.name);
  const titles = options.map((o) =>
    replacementLines(base, o)
      .map((l) => `${label(l)} · ${formatQty(l.qty, l.unit, 1, t, language)}`)
      .join(" + "),
  );

  async function done(action: Promise<unknown>) {
    await action;
    onClose();
  }

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="cant-find-title" className="text-xl font-semibold">
            {t.cantFind.title(name)}
          </h2>
          <p className="text-sm text-text-muted">
            {t.cantFind.context(usesText(item, t), amountLines(item, t, language).join(" + "))}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.sheet.close}
          className="grid size-tap shrink-0 place-items-center rounded-pill bg-fill-muted"
        >
          <CloseIcon size={18} />
        </button>
      </div>

      {options.length > 0 ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-xs font-semibold tracking-wide text-text-muted uppercase">
            {t.cantFind.tryInstead}
          </legend>
          {options.slice(0, 3).map((option, i) => (
            <label
              key={option.id}
              className={`flex min-h-tap items-start gap-3 rounded-row border bg-surface px-3.5 py-3 ${
                choice === i ? "border-text" : "border-border"
              }`}
            >
              <input
                type="radio"
                name="alternative"
                checked={choice === i}
                onChange={() => setChoice(i)}
                className="mt-0.5 size-5 shrink-0 accent-text"
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-body font-medium">{titles[i]}</span>
                <span className="text-xs text-text-muted">{option.note}</span>
              </span>
            </label>
          ))}
        </fieldset>
      ) : (
        <p className="text-body text-text-muted">{t.cantFind.none}</p>
      )}

      <div className="flex flex-col gap-2">
        {options.length > 0 && (
          <Button onClick={() => done(replaceItem(weekId, item.key, titles[choice]))}>{t.cantFind.use}</Button>
        )}
        <Button variant="secondary" onClick={() => done(setItemState(weekId, item.key, "skipped"))}>
          {t.cantFind.skip}
        </Button>
        {item.replacedBy && (
          <button
            type="button"
            onClick={() => done(replaceItem(weekId, item.key, undefined))}
            className="flex min-h-tap items-center justify-center text-sm text-text-muted underline underline-offset-4"
          >
            {t.cantFind.useOriginal}
          </button>
        )}
      </div>
    </>
  );
}
