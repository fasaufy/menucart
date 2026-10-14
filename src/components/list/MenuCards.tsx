"use client";

import { useState } from "react";
import { DishEditor } from "@/components/dish/DishEditor";
import { SwapTag } from "@/components/dish/SwapTag";
import { CloseIcon } from "@/components/icons";
import { Checkbox } from "@/components/ui/Checkbox";
import { Sheet } from "@/components/ui/Sheet";
import { HalalBadge } from "@/components/ui/HalalBadge";
import { hasNonHalal } from "@/lib/dishes/swaps";
import { setItemState, type PlannedMeal } from "@/lib/list/actions";
import { mergeDishes } from "@/lib/list/merge";
import type { Strings } from "@/lib/strings";
import type { Dish, Language, ListItem } from "@/lib/types";
import { dayName } from "@/lib/week";
import { amountLines, itemNames } from "./format";

type Props = {
  weekId: string;
  meals: PlannedMeal[];
  items: ListItem[];
  householdSize: number;
  halalMode: boolean;
  t: Strings;
  language: Language;
};

/**
 * The list split by planned meal: one card per slot with that dish's
 * groceries. Ticks are shared with the merged list (one state per
 * ingredient), so garlic ticked here is ticked in every card.
 */
export function MenuCards({ weekId, meals, items, householdSize, halalMode, t, language }: Props) {
  const byKey = new Map(items.map((i) => [i.key, i]));
  // Look the dish up from the live plan so swaps saved in the editor show at once.
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = meals.find((m) => m.dish.id === editingId)?.dish ?? null;
  const setEditing = (dish: Dish | null) => setEditingId(dish?.id ?? null);

  return (
    <div className="flex flex-col gap-3">
      <Sheet open={!!editing} onClose={() => setEditing(null)} labelledBy="dish-editor-title">
        {editing && (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <p className="text-meta text-text-muted">{t.editor.title}</p>
                <h2 id="dish-editor-title" className="text-xl font-semibold">
                  {editing.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                aria-label={t.sheet.close}
                className="grid size-tap shrink-0 place-items-center rounded-pill bg-fill-muted"
              >
                <CloseIcon size={18} />
              </button>
            </div>
            <DishEditor
              key={editing.id}
              dish={editing}
              t={t}
              language={language}
              halalMode={halalMode}
              onDone={() => setEditing(null)}
            />
          </>
        )}
      </Sheet>
      {meals.map(({ day, meal, dish }) => {
        // Per-dish amounts, scaled and rounded the same way as the merged list.
        const lines = mergeDishes([dish], householdSize);
        return (
          <section
            key={`${day}-${meal}`}
            aria-label={`${t.sheet.slot(dayName(weekId, day, language), t.meals[meal])}: ${dish.name}`}
            className="flex flex-col rounded-card border border-border bg-surface"
          >
            <div className="flex flex-col gap-1.5 px-3.5 pt-3 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="rounded-pill bg-text px-2 py-0.5 text-xs font-semibold tracking-wide text-surface uppercase">
                  {t.meals[meal]}
                </span>
                <span className="text-xs text-text-muted">{dayName(weekId, day, language)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold">{dish.name}</h3>
                <button
                  type="button"
                  onClick={() => setEditing(dish)}
                  className="-my-2 -mr-2 flex min-h-tap shrink-0 items-center px-2 text-sm text-text-muted underline underline-offset-4"
                >
                  {dish.ingredients.length ? t.editor.edit : t.editor.addFirst}
                </button>
              </div>
              {halalMode && hasNonHalal(dish) && <HalalBadge status="non_halal" />}
            </div>

            {lines.length === 0 ? (
              <p className="border-t border-fill-muted px-3.5 py-3 text-meta text-text-muted">
                {t.list.noIngredients}
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-fill-muted border-t border-fill-muted">
                {lines.map((line) => {
                  const item = byKey.get(line.key);
                  const covered = item?.state === "at_home" || item?.state === "bought";
                  const status =
                    item?.state === "bought"
                      ? t.list.inBasket
                      : item?.state === "at_home"
                        ? t.list.atHome
                        : item?.state === "skipped"
                          ? t.cantFind.skippedLabel
                          : item?.replacedBy
                            ? `→ ${item.replacedBy}`
                            : null;
                  return (
                    <li key={line.key}>
                      <label className="flex min-h-tap items-center gap-3 px-3.5 py-2.5">
                        <Checkbox
                          checked={covered}
                          // Not on the saved list yet: the "Plan changed" banner offers Update.
                          disabled={!item}
                          onChange={(e) =>
                            setItemState(weekId, line.key, e.target.checked ? "at_home" : "to_buy")
                          }
                        />
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className={`text-body ${covered ? "text-text-muted line-through" : ""}`}>
                            {itemNames(line, language).primary}
                          </span>
                          {status && <span className="text-xs text-text-muted">{status}</span>}
                          {line.swappedFrom && <SwapTag from={line.swappedFrom} t={t} />}
                          {halalMode && line.halal === "non_halal" && <HalalBadge status="non_halal" />}
                          {halalMode && line.halal === "check" && (
                            <span className="text-xs text-text-muted">{t.list.checkHalal}</span>
                          )}
                        </span>
                        <span className="flex shrink-0 flex-col items-end text-meta text-text-muted tabular-nums">
                          {amountLines(line, t, language).map((a) => (
                            <span key={a}>{a}</span>
                          ))}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
      {items.some((i) => i.carriedOver) && (
        <section aria-label={t.list.fromLastWeek} className="flex flex-col rounded-card border border-border bg-surface">
          <div className="px-3.5 pt-3 pb-2.5">
            <span className="rounded-pill bg-fill-muted px-2 py-0.5 text-xs font-semibold tracking-wide uppercase">
              {t.list.fromLastWeek}
            </span>
          </div>
          <ul className="flex flex-col divide-y divide-fill-muted border-t border-fill-muted">
            {items
              .filter((i) => i.carriedOver)
              .map((item) => {
                const covered = item.state === "at_home" || item.state === "bought";
                return (
                  <li key={item.key}>
                    <label className="flex min-h-tap items-center gap-3 px-3.5 py-2.5">
                      <Checkbox
                        checked={covered}
                        onChange={(e) => setItemState(weekId, item.key, e.target.checked ? "at_home" : "to_buy")}
                      />
                      <span className={`min-w-0 flex-1 text-body ${covered ? "text-text-muted line-through" : ""}`}>
                        {itemNames(item, language).primary}
                      </span>
                      <span className="shrink-0 text-meta text-text-muted tabular-nums">
                        {amountLines(item, t, language).join(" + ")}
                      </span>
                    </label>
                  </li>
                );
              })}
          </ul>
        </section>
      )}
    </div>
  );
}
