import { CaretCircleLeftIcon, CaretCircleRightIcon } from "@/components/icons";
import { Card, Group } from "@/components/ui/Group";
import type { Strings } from "@/lib/strings";

type Props = {
  title: string;
  range: string | null;
  planned: number;
  total: number;
  status: string | null;
  disabled: boolean;
  t: Strings;
  onPrev: () => void;
  onNext: () => void;
};

const arrow =
  "grid size-tap shrink-0 place-items-center rounded-pill bg-surface text-accent shadow-float disabled:text-border-strong";

/** "‹ This week ›" with the week's progress underneath. */
export function WeekHeader({ title, range, planned, total, status, disabled, t, onPrev, onNext }: Props) {
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
      <Card className="gap-3">
        <div className="flex min-h-[1lh] justify-between text-meta text-text-muted">
          {status !== null && (
            <>
              <span>{t.plan.progress(planned, total)}</span>
              <span>{status}</span>
            </>
          )}
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={planned}
          aria-label={status !== null ? t.plan.progress(planned, total) : undefined}
          className="h-1.5 overflow-hidden rounded-pill bg-track"
        >
          <div
            className="h-1.5 rounded-pill bg-[linear-gradient(to_right,var(--progress-from),var(--progress-to))] transition-[width]"
            style={{ width: total ? `${(planned / total) * 100}%` : 0 }}
          />
        </div>
      </Card>
    </Group>
  );
}
