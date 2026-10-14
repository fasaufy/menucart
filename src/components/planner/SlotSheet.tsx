"use client";

import { useMemo, useState } from "react";
import { DishEditor } from "@/components/dish/DishEditor";
import { CloseIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { HalalBadge } from "@/components/ui/HalalBadge";
import { BREAKFAST_PICKS, suggestionsFor } from "@/lib/dishes/library";
import { hasNonHalal } from "@/lib/dishes/swaps";
import { normalize, searchDishes } from "@/lib/dishes/search";
import type { useDishes } from "@/lib/hooks";
import {
  clearSlot,
  moveSlot,
  repeatMeal,
  saveOwnDish,
  setSlotDish,
  type SlotRef,
} from "@/lib/plan";
import type { Strings } from "@/lib/strings";
import type { Day, Dish, Language, Slot } from "@/lib/types";
import type { ISODate } from "@/lib/week";

export const SLOT_SHEET_TITLE_ID = "slot-sheet-title";

export type MoveOption = SlotRef & { label: string };

type Props = {
  weekStart: ISODate;
  target: SlotRef;
  slot: Slot | undefined;
  title: string;
  dishes: NonNullable<ReturnType<typeof useDishes>>;
  recentIds: string[];
  halalMode: boolean;
  language: Language;
  moveOptions: MoveOption[];
  /** Empty days this meal could be repeated on. */
  repeatDays: Day[];
  t: Strings;
  onDone: () => void;
};

export function SlotSheet(props: Props) {
  const { slot, title, t, onDone, dishes, halalMode, language } = props;
  const [mode, setMode] = useState<"add" | "manage" | "ingredients">(slot ? "manage" : "add");
  const dish = dishes.get(slot?.dishId);

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          {mode === "add" && (
            <p className="text-meta text-text-muted">{t.sheet.addingTo}</p>
          )}
          {mode === "ingredients" && dish && (
            <p className="text-meta text-text-muted">
              {t.editor.title} · {dish.name}
            </p>
          )}
          <h2 id={SLOT_SHEET_TITLE_ID} className="text-xl font-semibold">
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onDone}
          aria-label={t.sheet.close}
          className="grid size-tap shrink-0 place-items-center rounded-pill bg-fill-muted"
        >
          <CloseIcon size={18} />
        </button>
      </div>
      {mode === "add" && <AddDish {...props} />}
      {mode === "manage" && slot && (
        // The slot can vanish mid-render after Clear or Move, before the sheet closes.
        <ManageSlot
          {...props}
          slot={slot}
          onChange={() => setMode("add")}
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

function AddDish({ weekStart, target, dishes, recentIds, halalMode, t, onDone }: Props) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchDishes(dishes.all, query), [dishes, query]);
  const trimmed = query.trim();
  const exactMatch = results.some((d) => normalize(d.name) === normalize(trimmed));

  const quickPicks = target.meal === "breakfast" ? pickDishes(BREAKFAST_PICKS) : [];
  const recent = pickDishes(recentIds).filter((d) => !quickPicks.includes(d));
  const shown = new Set([...quickPicks, ...recent]);
  const ideas = suggestionsFor(target.meal, target.day).filter((d) => !shown.has(d));

  function pickDishes(ids: string[]) {
    return ids.map((id) => dishes.get(id)).filter((d): d is Dish => !!d);
  }

  async function pick(dish: Dish) {
    await setSlotDish(weekStart, target, dish);
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
          className="h-button rounded-row border-[1.5px] border-text bg-surface px-3.5 text-base placeholder:text-text-muted"
        />
      </form>

      {results.length > 0 && (
        <ul className="flex flex-col divide-y divide-fill-muted rounded-card border border-border bg-surface">
          {results.map((dish) => (
            <li key={dish.id}>
              <button
                type="button"
                onClick={() => pick(dish)}
                className="flex min-h-tap w-full flex-col items-start gap-1.5 p-3.5 text-left"
              >
                <span className="text-body font-medium">{dish.name}</span>
                <span className="text-xs text-text-muted">{dishMeta(dish, t)}</span>
                {halalMode && hasNonHalal(dish) && <HalalBadge status="non_halal" />}
              </button>
            </li>
          ))}
        </ul>
      )}

      {!trimmed && (
        <>
          <Chips title={t.sheet.quickPicks} dishes={quickPicks} onPick={pick} />
          <Chips title={t.sheet.recent} dishes={recent} onPick={pick} />
          <Chips title={t.sheet.ideas(t.meals[target.meal])} dishes={ideas} onPick={pick} />
        </>
      )}

      {trimmed && !exactMatch && (
        <button
          type="button"
          onClick={addOwn}
          className="flex min-h-button items-center justify-center rounded-card border-[1.5px] border-text px-4 text-center text-body font-medium"
        >
          {t.sheet.addOwn(trimmed)}
        </button>
      )}
    </>
  );
}

function dishMeta(dish: Dish, t: Strings) {
  const count = t.sheet.ingredients(dish.ingredients.length);
  if (dish.source === "user") {
    if (dish.ingredients.length) return `${t.sheet.ownDish} · ${count}`;
    return dish.aiStatus === "pending" ? `${t.sheet.ownDish} · ${t.plan.aiWorking}` : t.sheet.ownDish;
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
    <section className="flex flex-col gap-2.5">
      <h3 className="text-meta font-semibold tracking-wide text-text-muted uppercase">
        {title}
      </h3>
      <div className="flex flex-wrap gap-2">
        {dishes.map((dish) => (
          <button
            key={dish.id}
            type="button"
            onClick={() => onPick(dish)}
            className="min-h-tap rounded-pill border border-border-strong bg-surface px-3.5 text-sm"
          >
            {dish.name}
          </button>
        ))}
      </div>
    </section>
  );
}

function ManageSlot({
  weekStart,
  target,
  slot,
  dishes,
  halalMode,
  moveOptions,
  repeatDays,
  t,
  onDone,
  onChange,
  onEditIngredients,
}: Props & { slot: Slot; onChange: () => void; onEditIngredients: () => void }) {
  const dish = dishes.get(slot.dishId);
  const [moveTo, setMoveTo] = useState(0);

  return (
    <>
      <div className="flex flex-col gap-1.5 rounded-card border border-border bg-surface p-3.5">
        <p className="text-base font-semibold">{slot.dishName}</p>
        {dish && <p className="text-xs text-text-muted">{dishMeta(dish, t)}</p>}
        {halalMode && dish && hasNonHalal(dish) && <HalalBadge status="non_halal" />}
      </div>

      {dish && (
        <Button variant={dish.ingredients.length ? "secondary" : "primary"} onClick={onEditIngredients}>
          {dish.ingredients.length ? t.editor.edit : t.editor.addFirst}
        </Button>
      )}

      <Button variant="secondary" onClick={onChange}>
        {t.sheet.changeDish}
      </Button>

      {repeatDays.length > 0 && slot.dishId && (
        <Button
          variant="secondary"
          onClick={async () => {
            await repeatMeal(weekStart, target.meal, repeatDays, { id: slot.dishId!, name: slot.dishName });
            onDone();
          }}
        >
          {t.sheet.repeatAllWeek(t.meals[target.meal], repeatDays.length)}
        </Button>
      )}

      {moveOptions.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="move-to" className="text-meta text-text-muted">
            {t.sheet.moveTo}
          </label>
          <div className="flex gap-2">
            <select
              id="move-to"
              value={moveTo}
              onChange={(e) => setMoveTo(Number(e.target.value))}
              className="h-button min-w-0 flex-1 rounded-row border border-border-strong bg-surface px-3 text-body"
            >
              {moveOptions.map((option, i) => (
                <option key={`${option.day}-${option.meal}`} value={i}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button
              variant="secondary"
              fullWidth={false}
              onClick={async () => {
                await moveSlot(weekStart, target, moveOptions[moveTo]);
                onDone();
              }}
            >
              {t.sheet.move}
            </Button>
          </div>
        </div>
      )}

      <Button
        variant="secondary"
        onClick={async () => {
          await clearSlot(weekStart, target);
          onDone();
        }}
      >
        {t.sheet.clear}
      </Button>
    </>
  );
}
