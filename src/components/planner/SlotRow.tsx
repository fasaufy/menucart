"use client";

import { InfoIcon, RepeatIcon } from "@/components/icons";
import { HalalBadge } from "@/components/ui/HalalBadge";
import { effectiveIngredients, hasNonHalal, pendingSwaps } from "@/lib/dishes/swaps";
import type { Strings } from "@/lib/strings";
import { AI_GENERATION_ENABLED } from "@/lib/ai-config";
import { useOnline } from "@/lib/useOnline";
import type { Dish, Meal, Slot } from "@/lib/types";

type Props = {
  meal: Meal;
  slot: Slot | undefined;
  dish: Dish | undefined;
  /** Ingredient keys skipped in the store this week. */
  skipped?: Set<string>;
  editable: boolean;
  halalMode: boolean;
  /** Not the first row on the paper: draws the dashed rule above it. */
  divided: boolean;
  t: Strings;
  onOpen: () => void;
  onRepeat?: () => void;
};

/** One meal on the day's paper: label column, then the dish (or an Add button). */
export function SlotRow({ meal, slot, dish, skipped, editable, halalMode, divided, t, onOpen, onRepeat }: Props) {
  const online = useOnline();
  const mealLabel = t.meals[meal];
  const row = `flex min-h-tap w-full gap-1 bg-sunken text-left ${divided ? "border-t border-dashed border-divider" : ""}`;
  const labelCol = <span className="w-16 shrink-0 pt-px text-xs leading-[1.35] text-meal-label">{mealLabel}</span>;

  if (!slot) {
    if (!editable) {
      return (
        <div className={`${row} items-center p-3.5`}>
          {labelCol}
          <span className="text-body text-text-muted">{t.plan.notPlanned}</span>
        </div>
      );
    }
    // Empty slots are "Add" targets, never errors.
    return (
      <div className={`${row} items-center px-3.5 py-2`}>
        {labelCol}
        <button
          type="button"
          onClick={onOpen}
          className="flex min-h-10 items-center rounded-pill border border-border bg-surface px-4 text-[0.9375rem] font-semibold shadow-button"
        >
          {t.plan.add(mealLabel)}
        </button>
      </div>
    );
  }

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
    <div className={`${row} items-start`}>
      <button
        type="button"
        onClick={onOpen}
        disabled={!editable}
        className="flex min-h-tap flex-1 items-start gap-1 py-3.5 pl-3.5 text-left"
      >
        {labelCol}
        <span className="flex min-w-0 flex-col items-start gap-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-body leading-[1.4] font-medium">{slot.dishName}</span>
            {slot.isSample && (
              <span className="rounded-pill border border-border-strong px-1.5 py-px text-[0.625rem] font-semibold tracking-wide text-text-muted uppercase">
                {t.sample.tag}
              </span>
            )}
          </span>
          {halalMode && dish && <DishHalalBadge dish={dish} t={t} />}
          {aiNote && <span className="text-xs text-text-muted">{aiNote}</span>}
          {missing > 0 && (
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <InfoIcon size={12} />
              {t.plan.missing(missing)}
            </span>
          )}
        </span>
      </button>
      {onRepeat ? (
        // 44px tap target around a 32px pill.
        <button type="button" onClick={onRepeat} className="flex min-h-tap shrink-0 items-center self-center pr-2 pl-1">
          <span className="flex h-8 items-center gap-1 rounded-pill border border-border bg-surface px-2.5 text-xs font-medium shadow-button">
            <RepeatIcon size={12} strokeWidth={2.2} />
            {t.plan.repeatAllWeek}
          </span>
        </button>
      ) : (
        <span className="w-3.5 shrink-0" />
      )}
    </div>
  );
}

/** "Non-halal · 1 swap" until decided; "Halal · swapped" once swaps are applied. */
function DishHalalBadge({ dish, t }: { dish: Dish; t: Strings }) {
  if (hasNonHalal(dish)) {
    const pending = pendingSwaps(dish).length;
    return <HalalBadge status="non_halal" detail={pending ? t.swap.pending(pending) : undefined} />;
  }
  const swapped = Object.values(dish.swaps ?? {}).some((c) => c !== "keep");
  return swapped ? <HalalBadge status="halal" detail={t.swap.swapped} /> : null;
}
