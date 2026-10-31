import { formatRupiah, rupiahNumber } from "@/lib/money";
import type { WeekMoney } from "@/lib/prices/price";
import type { Strings } from "@/lib/strings";

type Props = {
  money: WeekMoney;
  t: Strings;
  /** "sm": one line over the bar (planner). "lg": a big total (list, pantry). */
  size?: "sm" | "lg";
  /** Small heading above a big total ("To buy"). */
  label?: string;
  bar?: boolean;
};

/**
 * Spend against the weekly budget: "Rp142.500 / Rp200.000 · Rp57.500 left".
 * Over budget the rest turns to the warning colour and says so in words.
 * With lines that have no price yet, the total is marked ≈.
 */
export function BudgetMeter({ money, t, size = "lg", label, bar = true }: Props) {
  const over = money.left < 0;
  const approx = money.missing.length > 0;
  const spend = formatRupiah(money.spend, { estimated: approx });
  const budget = formatRupiah(money.budget);
  const rest = over ? t.budget.over(formatRupiah(-money.left)) : t.budget.left(formatRupiah(money.left));
  const fill = money.budget > 0 ? Math.min(1, money.spend / money.budget) : 1;
  const restClasses = over ? "font-semibold text-halal-flag-text" : "";

  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={money.budget}
      aria-valuenow={Math.min(money.spend, money.budget)}
      aria-valuetext={t.budget.meter(spend, budget, rest)}
      className="flex flex-col gap-3"
    >
      {size === "sm" ? (
        <p aria-hidden="true" className="flex justify-between gap-3 text-meta text-text-muted tabular-nums">
          <span>
            <span className="font-semibold text-text">{spend}</span> / {budget}
          </span>
          <span className={restClasses}>{rest}</span>
        </p>
      ) : (
        <div aria-hidden="true" className="flex flex-col gap-1">
          {label && <span className="text-xs text-text-muted">{label}</span>}
          <p className="flex items-baseline justify-between gap-3 tabular-nums">
            <span className="flex items-baseline gap-1.5">
              <span className="text-body">{approx ? "≈Rp" : "Rp"}</span>
              <span className="font-display text-[1.375rem] leading-tight font-bold">{rupiahNumber(money.spend)}</span>
              <span className="text-meta font-medium text-text-muted">/ {budget}</span>
            </span>
            <span className={`text-meta font-medium ${restClasses || "text-text-muted"}`}>{rest}</span>
          </p>
        </div>
      )}
      {bar && (
        <div className="h-1.5 overflow-hidden rounded-pill bg-track">
          <div
            className="h-1.5 rounded-pill bg-[linear-gradient(to_right,var(--progress-from),var(--progress-to))] transition-[width]"
            style={{ width: `${fill * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
