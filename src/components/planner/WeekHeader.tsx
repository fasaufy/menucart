import { CaretCircleLeftIcon, CaretCircleRightIcon } from "@/components/icons";
import { BudgetMeter } from "@/components/list/BudgetMeter";
import { Card, Group } from "@/components/ui/Group";
import type { WeekMoney } from "@/lib/prices/price";
import type { Strings } from "@/lib/strings";

type Props = {
  title: string;
  range: string | null;
  /** The week's projected spend; null while loading. */
  money: WeekMoney | null;
  disabled: boolean;
  t: Strings;
  onPrev: () => void;
  onNext: () => void;
};

const arrow =
  "grid size-tap shrink-0 place-items-center rounded-pill bg-surface text-accent shadow-float disabled:text-border-strong";

/** "‹ This week ›" with the week's spend against the budget underneath (P4). */
export function WeekHeader({ title, range, money, disabled, t, onPrev, onNext }: Props) {
  return (
    <Group>
      <div className="flex items-center justify-between p-2">
        <button type="button" aria-label={t.plan.prevWeekLabel} onClick={onPrev} disabled={disabled} className={arrow}>
          <CaretCircleLeftIcon />
        </button>
        <div className="flex flex-col items-center gap-0.5 text-center">
          <h1 className="font-display text-base leading-tight font-semibold">{title}</h1>
          <p className="min-h-[1lh] text-meta text-text-muted">{range}</p>
        </div>
        <button type="button" aria-label={t.plan.nextWeekLabel} onClick={onNext} disabled={disabled} className={arrow}>
          <CaretCircleRightIcon />
        </button>
      </div>
      <Card className="min-h-[3.75rem] justify-center">{money && <BudgetMeter money={money} size="sm" t={t} />}</Card>
    </Group>
  );
}
