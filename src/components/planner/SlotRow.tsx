import { InfoIcon, RepeatIcon } from "@/components/icons";
import { HalalBadge } from "@/components/ui/HalalBadge";
import { effectiveIngredients, hasNonHalal, pendingSwaps } from "@/lib/dishes/swaps";
import type { Strings } from "@/lib/strings";
import type { Dish, Meal, Slot } from "@/lib/types";

type Props = {
  meal: Meal;
  slot: Slot | undefined;
  dish: Dish | undefined;
  /** Ingredient keys skipped in the store this week. */
  skipped?: Set<string>;
  editable: boolean;
  halalMode: boolean;
  t: Strings;
  onOpen: () => void;
  onRepeat?: () => void;
};

const rowBase = "flex min-h-tap w-full items-center gap-3 rounded-row px-3.5 py-3 text-left";

export function SlotRow({ meal, slot, dish, skipped, editable, halalMode, t, onOpen, onRepeat }: Props) {
  const mealLabel = t.meals[meal];
  const labelCol = <span className="w-16 shrink-0 text-xs text-text-muted">{mealLabel}</span>;

  if (!slot) {
    if (!editable) {
      return (
        <div className={`${rowBase} border border-dashed border-border text-text-muted`}>
          {labelCol}
          <span className="text-body">{t.plan.notPlanned}</span>
        </div>
      );
    }
    // Empty slots are dashed "Add" targets, never errors.
    return (
      <button
        type="button"
        onClick={onOpen}
        className={`${rowBase} border-[1.5px] border-dashed border-border-strong text-text-muted`}
      >
        {labelCol}
        <span className="text-body">{t.plan.add(mealLabel)}</span>
      </button>
    );
  }

  const needsIngredients = dish?.ingredients.length === 0;
  // PRD: an item skipped in the store flags the dishes that need it.
  const missing = dish && skipped?.size ? effectiveIngredients(dish).filter((i) => skipped.has(i.key)).length : 0;

  return (
    <div className="flex items-center rounded-row border border-border bg-surface pr-2">
      <button
        type="button"
        onClick={onOpen}
        disabled={!editable}
        className={`${rowBase} flex-1 pr-1.5`}
      >
        {labelCol}
        <span className="flex min-w-0 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-body font-medium">{slot.dishName}</span>
            {slot.isSample && (
              <span className="rounded-pill border border-border-strong px-1.5 py-px text-[0.6875rem] font-semibold tracking-wide text-text-muted uppercase">
                {t.sample.tag}
              </span>
            )}
          </span>
          {halalMode && dish && <DishHalalBadge dish={dish} t={t} />}
          {needsIngredients && (
            <span className="text-xs text-text-muted">{t.plan.needsIngredients}</span>
          )}
          {missing > 0 && (
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <InfoIcon size={12} strokeWidth={2.2} />
              {t.plan.missing(missing)}
            </span>
          )}
        </span>
      </button>
      {onRepeat && (
        // 44px tap target around a 32px pill.
        <button type="button" onClick={onRepeat} className="flex min-h-tap shrink-0 items-center">
          <span className="flex h-8 items-center gap-1 rounded-pill border border-border-strong bg-surface px-2.5 text-xs">
            <RepeatIcon size={12} strokeWidth={2.2} />
            {t.plan.repeatAllWeek}
          </span>
        </button>
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
