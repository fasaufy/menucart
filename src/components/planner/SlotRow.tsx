import { RepeatIcon } from "@/components/icons";
import { HalalBadge } from "@/components/ui/HalalBadge";
import { hasNonHalal } from "@/lib/dishes/library";
import type { Strings } from "@/lib/strings";
import type { Dish, Meal, Slot } from "@/lib/types";

type Props = {
  meal: Meal;
  slot: Slot | undefined;
  dish: Dish | undefined;
  editable: boolean;
  halalMode: boolean;
  t: Strings;
  onOpen: () => void;
  onRepeat?: () => void;
};

const rowBase = "flex min-h-tap w-full items-center gap-3 rounded-row px-3.5 py-3 text-left";

export function SlotRow({ meal, slot, dish, editable, halalMode, t, onOpen, onRepeat }: Props) {
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
          <span className="text-body font-medium">{slot.dishName}</span>
          {halalMode && dish && hasNonHalal(dish) && <HalalBadge status="non_halal" />}
          {needsIngredients && (
            <span className="text-xs text-text-muted">{t.plan.needsIngredients}</span>
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
