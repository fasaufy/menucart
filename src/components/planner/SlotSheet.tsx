"use client";

import { useMemo, useState } from "react";
import { DishEditor } from "@/components/dish/DishEditor";
import { ChevronDownIcon, PencilIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Card, Group, rowDivider } from "@/components/ui/Group";
import { HalalBadge } from "@/components/ui/HalalBadge";
import { chipClasses, inputClasses, overlineClasses, selectClasses, sheetTitleClasses } from "@/components/ui/Input";
import { SheetClose } from "@/components/ui/Sheet";
import { AI_GENERATION_ENABLED } from "@/lib/ai-config";
import { BREAKFAST_PICKS, suggestionsFor } from "@/lib/dishes/library";
import { hasNonHalal } from "@/lib/dishes/swaps";
import { normalize, searchDishes } from "@/lib/dishes/search";
import type { useDishes } from "@/lib/hooks";
import {
  addSlotDish,
  moveSlotDish,
  removeSlotDish,
  replaceSlotDish,
  saveOwnDish,
  slotDishes,
  type SlotRef,
} from "@/lib/plan";
import type { Strings } from "@/lib/strings";
import type { Dish, Language, Slot, SlotDish } from "@/lib/types";
import type { ISODate } from "@/lib/week";

export const SLOT_SHEET_TITLE_ID = "slot-sheet-title";

export type MoveOption = SlotRef & { label: string };

type Props = {
  weekStart: ISODate;
  /** With an index: manage that dish. Without: add a dish to the meal. */
  target: SlotRef & { index?: number };
  slot: Slot | undefined;
  title: string;
  dishes: NonNullable<ReturnType<typeof useDishes>>;
  recentIds: string[];
  halalMode: boolean;
  language: Language;
  moveOptions: MoveOption[];
  t: Strings;
  onDone: () => void;
};

export function SlotSheet(props: Props) {
  const { slot, target, title, t, onDone, dishes, halalMode, language } = props;
  const entry = target.index === undefined ? undefined : slotDishes(slot)[target.index];
  const [mode, setMode] = useState<"add" | "change" | "manage" | "ingredients">(entry ? "manage" : "add");
  const dish = dishes.get(entry?.dishId);

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          {(mode === "add" || mode === "change") && (
            <p className="text-meta text-text-muted">{t.sheet.addingTo}</p>
          )}
          {mode === "ingredients" && dish && (
            <p className="text-meta text-text-muted">
              {t.editor.title} · {dish.name}
            </p>
          )}
          <h2 id={SLOT_SHEET_TITLE_ID} className={sheetTitleClasses}>
            {title}
          </h2>
        </div>
        <SheetClose label={t.sheet.close} onClick={onDone} />
      </div>
      {mode === "add" && <AddDish {...props} />}
      {mode === "change" && <AddDish {...props} replacing={target.index} />}
      {mode === "manage" && entry && target.index !== undefined && (
        // The dish can vanish mid-render after Remove or Move, before the sheet closes.
        <ManageDish
          {...props}
          entry={entry}
          index={target.index}
          dishCount={slotDishes(slot).length}
          onChange={() => setMode("change")}
          onEditIngredients={() => setMode("ingredients")}
        />
      )}
      {mode === "ingredients" && dish && (
        <DishEditor
          dish={dish}
          t={t}
          language={language}
          halalMode={halalMode}
          onDone={() => setMode("manage")}
        />
      )}
    </>
  );
}

function AddDish({
  weekStart,
  target,
  slot,
  dishes,
  recentIds,
  halalMode,
  t,
  onDone,
  replacing,
}: Props & { replacing?: number }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchDishes(dishes.all, query), [dishes, query]);
  const trimmed = query.trim();
  const exactMatch = results.some((d) => normalize(d.name) === normalize(trimmed));

  // Dishes already in this meal aren't offered again.
  const inMeal = new Set(slotDishes(slot).map((d) => d.dishId));
  const quickPicks = target.meal === "breakfast" ? pickDishes(BREAKFAST_PICKS) : [];
  const recent = pickDishes(recentIds).filter((d) => !quickPicks.includes(d));
  const shown = new Set([...quickPicks, ...recent]);
  const ideas = suggestionsFor(target.meal, target.day).filter((d) => !shown.has(d) && !inMeal.has(d.id));

  function pickDishes(ids: string[]) {
    return ids.map((id) => dishes.get(id)).filter((d): d is Dish => !!d && !inMeal.has(d.id));
  }

  async function pick(dish: Dish) {
    if (replacing === undefined) await addSlotDish(weekStart, target, dish);
    else await replaceSlotDish(weekStart, { ...target, index: replacing }, dish);
    onDone();
  }

  async function addOwn() {
    await pick(await saveOwnDish(trimmed));
  }

  return (
    <>
      <form
        className="flex flex-col gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (results[0]) pick(results[0]);
          else if (trimmed) addOwn();
        }}
      >
        <label htmlFor="dish-name" className="text-meta text-text-muted">
          {t.sheet.dishName}
        </label>
        <input
          id="dish-name"
          data-autofocus
          type="text"
          autoComplete="off"
          enterKeyHint="done"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.sheet.placeholder}
          className={inputClasses}
        />
      </form>

      {results.length > 0 && (
        <Card className="py-0">
          <ul className="flex flex-col">
            {results.map((dish, i) => (
              <li key={dish.id} className={i ? rowDivider : ""}>
                <button
                  type="button"
                  onClick={() => pick(dish)}
                  className="flex min-h-tap w-full flex-col items-start gap-1 py-3 text-left"
                >
                  <span className="text-body leading-[1.4] font-medium">{dish.name}</span>
                  <span className="text-xs text-text-muted">{dishMeta(dish, t)}</span>
                  {halalMode && hasNonHalal(dish) && <HalalBadge t={t} status="non_halal" />}
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {!trimmed && (
        <>
          <Chips title={t.sheet.quickPicks} dishes={quickPicks} onPick={pick} />
          <Chips title={t.sheet.recent} dishes={recent} onPick={pick} />
          <Chips title={t.sheet.ideas(t.meals[target.meal])} dishes={ideas} onPick={pick} />
        </>
      )}

      {trimmed && !exactMatch && (
        <Button variant="secondary" onClick={addOwn} className="py-3">
          {AI_GENERATION_ENABLED ? t.sheet.addOwnAi(trimmed) : t.sheet.addOwn(trimmed)}
        </Button>
      )}
    </>
  );
}

function dishMeta(dish: Dish, t: Strings) {
  const count = t.sheet.ingredients(dish.ingredients.length);
  if (dish.source === "user") {
    if (dish.ingredients.length) return `${t.sheet.ownDish} · ${count}`;
    return AI_GENERATION_ENABLED && dish.aiStatus === "pending" ? `${t.sheet.ownDish} · ${t.plan.aiWorking}` : t.sheet.ownDish;
  }
  return dish.cuisine ? `${dish.cuisine} · ${count}` : count;
}

function Chips({
  title,
  dishes,
  onPick,
}: {
  title: string;
  dishes: Dish[];
  onPick: (dish: Dish) => void;
}) {
  if (!dishes.length) return null;
  return (
    <section className="flex flex-col gap-4">
      <h3 className={overlineClasses}>{title}</h3>
      <div className="flex flex-wrap gap-2">
        {dishes.map((dish) => (
          <button
            key={dish.id}
            type="button"
            onClick={() => onPick(dish)}
            className={chipClasses}
          >
            {dish.name}
          </button>
        ))}
      </div>
    </section>
  );
}

function ManageDish({
  weekStart,
  target,
  entry,
  index,
  dishCount,
  dishes,
  halalMode,
  moveOptions,
  t,
  onDone,
  onChange,
  onEditIngredients,
}: Props & {
  entry: SlotDish;
  index: number;
  dishCount: number;
  onChange: () => void;
  onEditIngredients: () => void;
}) {
  const dish = dishes.get(entry.dishId);
  const [moveTo, setMoveTo] = useState(0);
  const ref = { day: target.day, meal: target.meal, index };

  return (
    <>
      <Group>
        <Card className="flex-row items-center gap-6">
          <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
            <p className="text-base leading-[1.4] font-medium">{entry.dishName}</p>
            {dish && <p className="text-xs text-text-muted">{dishMeta(dish, t)}</p>}
            {halalMode && dish && hasNonHalal(dish) && <HalalBadge t={t} status="non_halal" />}
          </div>
          {dish && (
            <button
              type="button"
              onClick={onEditIngredients}
              aria-label={dish.ingredients.length ? t.editor.edit : t.editor.addFirst}
              className="grid size-12 shrink-0 place-items-center rounded-pill border-2 border-accent-edge bg-accent-gradient text-surface shadow-button"
            >
              <PencilIcon size={18} />
            </button>
          )}
        </Card>
        <div className="flex flex-col gap-1 py-1">
          {dish && !dish.ingredients.length && <Button onClick={onEditIngredients}>{t.editor.addFirst}</Button>}
          <Button variant="secondary" onClick={onChange}>
            {t.sheet.changeDish}
          </Button>
        </div>
      </Group>

      {moveOptions.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="move-to" className="text-meta text-text-muted">
            {t.sheet.moveTo}
          </label>
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <select id="move-to" value={moveTo} onChange={(e) => setMoveTo(Number(e.target.value))} className={selectClasses}>
                {moveOptions.map((option, i) => (
                  <option key={`${option.day}-${option.meal}`} value={i}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon size={18} className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-text-muted" />
            </div>
            <Button
              variant="secondary"
              fullWidth={false}
              className="w-24"
              onClick={async () => {
                await moveSlotDish(weekStart, ref, moveOptions[moveTo]);
                onDone();
              }}
            >
              {t.sheet.move}
            </Button>
          </div>
        </div>
      )}

      <Button
        variant="destructive"
        onClick={async () => {
          await removeSlotDish(weekStart, ref);
          onDone();
        }}
      >
        {dishCount > 1 ? t.sheet.removeDish : t.sheet.clear}
      </Button>
    </>
  );
}
