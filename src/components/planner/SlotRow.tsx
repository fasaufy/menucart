"use client";

import { InfoIcon } from "@/components/icons";
import { HalalBadge } from "@/components/ui/HalalBadge";
import { effectiveIngredients, hasNonHalal, pendingSwaps } from "@/lib/dishes/swaps";
import type { Strings } from "@/lib/strings";
import { AI_GENERATION_ENABLED } from "@/lib/ai-config";
import { useOnline } from "@/lib/useOnline";
import type { Dish, Meal, SlotDish } from "@/lib/types";

type Props = {
  meal: Meal;
  /** The meal's dishes, with their library or saved dish where known, and their cost line. */
  dishes: (SlotDish & { dish: Dish | undefined; cost?: string })[];
  isSample: boolean;
  /** Ingredient keys skipped in the store this week. */
  skipped?: Set<string>;
  editable: boolean;
  halalMode: boolean;
  /** Not the first row on the paper: draws the dashed rule above it. */
  divided: boolean;
  t: Strings;
  onOpen: (index: number) => void;
  onAdd: () => void;
};

const pill =
  "flex min-h-10 items-center self-start rounded-pill border border-border bg-surface px-4 text-[0.9375rem] font-semibold shadow-button";

/** One meal on the day's paper: label column, its dishes, then "Add more menu". */
export function SlotRow({ meal, dishes, isSample, skipped, editable, halalMode, divided, t, onOpen, onAdd }: Props) {
  const mealLabel = t.meals[meal];
  const labelCol = <span className="w-16 shrink-0 pt-px text-xs leading-[1.35] text-meal-label">{mealLabel}</span>;

  return (
    <div className={`flex w-full gap-1 p-3.5 ${divided ? "border-t border-dashed border-divider" : ""}`}>
      {labelCol}
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {dishes.length > 0 && (
          // Each dish is a 44px tap target; the negative margin lines the first
          // name up with the meal label and keeps the gap to "Add more menu".
          <ul className="-my-[0.6875rem] flex flex-col">
            {dishes.map((d, index) => (
              <li key={`${d.dishId ?? d.dishName}-${index}`}>
                <DishLine
                  entry={d}
                  isSample={isSample}
                  skipped={skipped}
                  editable={editable}
                  halalMode={halalMode}
                  t={t}
                  onOpen={() => onOpen(index)}
                />
              </li>
            ))}
          </ul>
        )}
        {editable ? (
          // Empty meals are "Add" targets, never errors.
          <button type="button" onClick={onAdd} className={pill}>
            {dishes.length ? t.plan.addMore : t.plan.add(mealLabel)}
          </button>
        ) : (
          !dishes.length && <span className="text-body text-text-muted">{t.plan.notPlanned}</span>
        )}
      </div>
    </div>
  );
}

function DishLine({
  entry,
  isSample,
  skipped,
  editable,
  halalMode,
  t,
  onOpen,
}: {
  entry: SlotDish & { dish: Dish | undefined; cost?: string };
  isSample: boolean;
  skipped?: Set<string>;
  editable: boolean;
  halalMode: boolean;
  t: Strings;
  onOpen: () => void;
}) {
  const online = useOnline();
  const { dish } = entry;
  const empty = dish?.ingredients.length === 0;
  const aiNote = !empty
    ? null
    : AI_GENERATION_ENABLED && dish?.aiStatus === "pending"
      ? online
        ? t.plan.aiWorking
        : t.plan.aiOffline
      : dish?.aiStatus === "unrecognized"
        ? t.plan.aiUnrecognized
        : t.plan.needsIngredients;
  // PRD: an item skipped in the store flags the dishes that need it.
  const missing = dish && skipped?.size ? effectiveIngredients(dish).filter((i) => skipped.has(i.key)).length : 0;

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!editable}
      className="flex min-h-tap w-full flex-col items-start justify-center gap-1 py-1 text-left"
    >
      <span className="flex flex-wrap items-center gap-2">
        <span className="text-body leading-[1.4] font-medium">{entry.dishName}</span>
        {isSample && (
          <span className="rounded-pill border border-border-strong px-1.5 py-px text-[0.625rem] font-semibold tracking-wide text-text-muted uppercase">
            {t.sample.tag}
          </span>
        )}
      </span>
      {halalMode && dish && <DishHalalBadge dish={dish} t={t} />}
      {entry.cost && <span className="text-xs text-text-muted tabular-nums">{entry.cost}</span>}
      {aiNote && <span className="text-xs text-text-muted">{aiNote}</span>}
      {missing > 0 && (
        <span className="flex items-center gap-1 text-xs text-text-muted">
          <InfoIcon size={12} />
          {t.plan.missing(missing)}
        </span>
      )}
    </button>
  );
}

/** "Non-halal · 1 swap" until decided; "Halal · swapped" once swaps are applied. */
function DishHalalBadge({ dish, t }: { dish: Dish; t: Strings }) {
  if (hasNonHalal(dish)) {
    const pending = pendingSwaps(dish).length;
    return <HalalBadge t={t} status="non_halal" detail={pending ? t.swap.pending(pending) : undefined} />;
  }
  const swapped = Object.values(dish.swaps ?? {}).some((c) => c !== "keep");
  return swapped ? <HalalBadge t={t} status="halal" detail={t.swap.swapped} /> : null;
}
