"use client";

import { memo, useMemo, useState } from "react";
import { DishEditor } from "@/components/dish/DishEditor";
import { SwapTag } from "@/components/dish/SwapTag";
import { PencilIcon } from "@/components/icons";
import { Card, Group, rowDivider } from "@/components/ui/Group";
import { sheetTitleClasses } from "@/components/ui/Input";
import { Sheet, SheetClose } from "@/components/ui/Sheet";
import { HalalBadge } from "@/components/ui/HalalBadge";
import { ItemRow } from "@/components/ui/ItemRow";
import { hasNonHalal } from "@/lib/dishes/swaps";
import { setItemState, type PlannedMeal } from "@/lib/list/actions";
import { mergeDishes, type MergedItem } from "@/lib/list/merge";
import { formatRupiah } from "@/lib/money";
import { dishCost } from "@/lib/prices/price";
import type { Strings } from "@/lib/strings";
import type { City, Day, Dish, Language, ListItem, Meal } from "@/lib/types";
import { dayName } from "@/lib/week";
import { amountLines, itemNames, lineMoney, rowRight } from "./format";

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
  city: City;
  halalMode: boolean;
  t: Strings;
  language: Language;
};

/**
 * The list split by planned meal: one card per slot with that dish's
 * groceries. Ticks are shared with the merged list (one state per
 * ingredient), so garlic ticked here is ticked in every card.
 */
export function MenuCards({ weekId, meals, items, householdSize, city, halalMode, t, language }: Props) {
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
      {meals.map(({ day, meal, index, dish }) => (
        <MenuCard
          key={`${day}-${meal}-${index}`}
          day={day}
          meal={meal}
          dish={dish}
          byKey={byKey}
          onEdit={setEditing}
          {...{ weekId, householdSize, city, halalMode, t, language }}
        />
      ))}
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
                    <ItemRow
                      name={itemNames(item, language).primary}
                      detail={item.state === "at_home" ? t.list.atHome : undefined}
                      checked={covered}
                      onToggle={(checked) => setItemState(weekId, item.key, checked ? "at_home" : "to_buy")}
                      {...rowRight(item, lineMoney(item, city, t, language), t, language)}
                    />
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

type CardProps = {
  weekId: string;
  day: Day;
  meal: Meal;
  dish: Dish;
  byKey: Map<string, ListItem>;
  householdSize: number;
  city: City;
  halalMode: boolean;
  t: Strings;
  language: Language;
  onEdit: (dish: Dish) => void;
};

function MenuCard({ weekId, day, meal, dish, byKey, householdSize, city, halalMode, t, language, onEdit }: CardProps) {
  // Per-dish amounts, scaled and rounded the same way as the merged list.
  // Kept between ticks so only the ticked row re-renders. Keyed on the dish's
  // id and edit time: saved dishes come back as new objects on every list update.
  const dishVersion = `${dish.id}:${dish.updatedAt ?? 0}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- dishVersion stands in for dish
  const lines = useMemo(() => mergeDishes([dish], householdSize), [dishVersion, householdSize]);
  return (
    <Group aria-label={`${t.sheet.slot(dayName(weekId, day, language), t.meals[meal])}: ${dish.name}`}>
      <div className="flex items-center justify-between gap-3 px-3.5 py-3">
        <div className="flex min-w-0 flex-col items-start gap-1">
          <div className="flex items-center gap-2">
            <span className={`${tagClasses} ${MEAL_TAG[meal]}`}>{t.meals[meal]}</span>
            <span className="text-xs text-text-muted tabular-nums">
              {dayName(weekId, day, language)}
              {lines.length > 0 && ` · ${formatRupiah(dishCost(dish, byKey, householdSize, city).cost, { estimated: true })}`}
            </span>
          </div>
          <h3 className="text-body leading-[1.4] font-medium">{dish.name}</h3>
          {halalMode && hasNonHalal(dish) && <HalalBadge t={t} status="non_halal" />}
        </div>
        <button
          type="button"
          onClick={() => onEdit(dish)}
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
            {lines.map((line, i) => (
              <MenuLine
                key={line.key}
                line={line}
                dishId={dish.id}
                item={byKey.get(line.key)}
                divided={i > 0}
                {...{ weekId, city, halalMode, t, language }}
              />
            ))}
          </ul>
        </Card>
      )}
    </Group>
  );
}

type LineProps = {
  weekId: string;
  /** This dish's own amount of the ingredient. */
  line: MergedItem;
  dishId: string;
  /** The shared list line (ticks and price); undefined until the list is updated. */
  item: ListItem | undefined;
  city: City;
  divided: boolean;
  halalMode: boolean;
  t: Strings;
  language: Language;
};

/** One ingredient row; re-renders only when its own list item changes. */
const MenuLine = memo(
  function MenuLine({ weekId, line, dishId, item, city, divided, halalMode, t, language }: LineProps) {
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
    // The price is the whole line's, shared with other dishes; the detail says how much this dish uses.
    const others = item?.uses.filter((u) => u.dishId !== dishId).map((u) => u.dishName) ?? [];
    const detail = [status, amountLines(line, t, language).join(" + "), others.length ? t.list.alsoIn(others.join(", ")) : null]
      .filter(Boolean)
      .join(" · ");
    const badges = line.swappedFrom || (halalMode && line.halal !== "halal");
    return (
      <li className={divided ? rowDivider : ""}>
        <ItemRow
          name={itemNames(line, language).primary}
          detail={detail}
          checked={covered}
          done={item?.state === "bought"}
          // Not on the saved list yet: the "Plan changed" banner offers Update.
          disabled={!item}
          onToggle={(checked) => setItemState(weekId, line.key, checked ? "at_home" : "to_buy")}
          extra={
            badges && (
              <>
                {line.swappedFrom && <SwapTag from={line.swappedFrom} t={t} />}
                {halalMode && line.halal === "non_halal" && <HalalBadge t={t} status="non_halal" />}
                {halalMode && line.halal === "check" && <HalalBadge t={t} status="check" label={t.list.checkHalal} />}
              </>
            )
          }
          {...(item
            ? rowRight(item, lineMoney(item, city, t, language), t, language)
            : { right: "atHome" as const, unit: amountLines(line, t, language).join(" + ") })}
        />
      </li>
    );
  },
  (a, b) =>
    a.line === b.line &&
    a.city === b.city &&
    a.dishId === b.dishId &&
    a.item?.updatedAt === b.item?.updatedAt &&
    !!a.item === !!b.item &&
    a.divided === b.divided &&
    a.halalMode === b.halalMode &&
    a.t === b.t &&
    a.language === b.language &&
    a.weekId === b.weekId,
);
