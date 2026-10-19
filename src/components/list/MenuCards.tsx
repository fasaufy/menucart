"use client";

import { useState } from "react";
import { DishEditor } from "@/components/dish/DishEditor";
import { SwapTag } from "@/components/dish/SwapTag";
import { PencilIcon } from "@/components/icons";
import { Checkbox } from "@/components/ui/Checkbox";
import { Card, Group, rowDivider } from "@/components/ui/Group";
import { sheetTitleClasses } from "@/components/ui/Input";
import { Sheet, SheetClose } from "@/components/ui/Sheet";
import { HalalBadge } from "@/components/ui/HalalBadge";
import { hasNonHalal } from "@/lib/dishes/swaps";
import { setItemState, type PlannedMeal } from "@/lib/list/actions";
import { mergeDishes } from "@/lib/list/merge";
import type { Strings } from "@/lib/strings";
import type { Dish, Language, ListItem, Meal } from "@/lib/types";
import { dayName } from "@/lib/week";
import { amountLines, itemNames } from "./format";

const MEAL_TAG: Record<Meal, string> = {
  breakfast: "bg-meal-breakfast text-text",
  lunch: "bg-meal-lunch text-surface",
  dinner: "bg-meal-dinner text-surface",
};

const tagClasses = "rounded-pill px-2 py-0.5 text-[0.625rem] leading-[1.35] font-semibold tracking-[0.04em] uppercase";

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
                <h2 id="dish-editor-title" className={sheetTitleClasses}>
                  {editing.name}
                </h2>
              </div>
              <SheetClose label={t.sheet.close} onClick={() => setEditing(null)} />
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
          <Group
            key={`${day}-${meal}`}
            aria-label={`${t.sheet.slot(dayName(weekId, day, language), t.meals[meal])}: ${dish.name}`}
          >
            <div className="flex items-center justify-between gap-3 px-3.5 py-3">
              <div className="flex min-w-0 flex-col items-start gap-1">
                <div className="flex items-center gap-2">
                  <span className={`${tagClasses} ${MEAL_TAG[meal]}`}>{t.meals[meal]}</span>
                  <span className="text-xs text-text-muted">{dayName(weekId, day, language)}</span>
                </div>
                <h3 className="text-body leading-[1.4] font-medium">{dish.name}</h3>
                {halalMode && hasNonHalal(dish) && <HalalBadge status="non_halal" />}
              </div>
              <button
                type="button"
                onClick={() => setEditing(dish)}
                aria-label={`${dish.ingredients.length ? t.editor.edit : t.editor.addFirst}: ${dish.name}`}
                className="grid size-10 shrink-0 place-items-center rounded-pill border-[1.5px] border-accent-edge bg-accent-gradient text-surface shadow-button"
              >
                <PencilIcon size={16} />
              </button>
            </div>

            {lines.length === 0 ? (
              <Card>
                <p className="text-meta text-text-muted">{t.list.noIngredients}</p>
              </Card>
            ) : (
              <Card className="py-1">
              <ul className="flex flex-col">
                {lines.map((line, i) => {
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
                    <li key={line.key} className={i ? rowDivider : ""}>
                      <label className="flex min-h-tap items-center gap-3 py-2.5">
                        <Checkbox
                          checked={covered}
                          // Not on the saved list yet: the "Plan changed" banner offers Update.
                          disabled={!item}
                          onChange={(e) =>
                            setItemState(weekId, line.key, e.target.checked ? "at_home" : "to_buy")
                          }
                        />
                        <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                          <span className="text-body leading-[1.4]">{itemNames(line, language).primary}</span>
                          {status && <span className="text-xs text-text-muted">{status}</span>}
                          {line.swappedFrom && <SwapTag from={line.swappedFrom} t={t} />}
                          {halalMode && line.halal === "non_halal" && <HalalBadge status="non_halal" />}
                          {halalMode && line.halal === "check" && <HalalBadge status="check" label={t.list.checkHalal} />}
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
              </Card>
            )}
          </Group>
        );
      })}
      {items.some((i) => i.carriedOver) && (
        <Group aria-label={t.list.fromLastWeek}>
          <div className="flex px-3.5 py-3">
            <span className={`${tagClasses} bg-border-strong/50 text-text`}>{t.list.fromLastWeek}</span>
          </div>
          <Card className="py-1">
          <ul className="flex flex-col">
            {items
              .filter((i) => i.carriedOver)
              .map((item, i) => {
                const covered = item.state === "at_home" || item.state === "bought";
                return (
                  <li key={item.key} className={i ? rowDivider : ""}>
                    <label className="flex min-h-tap items-center gap-3 py-2.5">
                      <Checkbox
                        checked={covered}
                        onChange={(e) => setItemState(weekId, item.key, e.target.checked ? "at_home" : "to_buy")}
                      />
                      <span className="min-w-0 flex-1 text-body">{itemNames(item, language).primary}</span>
                      <span className="shrink-0 text-meta text-text-muted tabular-nums">
                        {amountLines(item, t, language).join(" + ")}
                      </span>
                    </label>
                  </li>
                );
              })}
          </ul>
          </Card>
        </Group>
      )}
    </div>
  );
}
