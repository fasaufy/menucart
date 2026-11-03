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
        // Each amount stays whole; on narrow phones "left/over" drops to its own line, right-aligned.
        <p aria-hidden="true" className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 text-meta text-text-muted tabular-nums">
          <span className="whitespace-nowrap">
            <span className="font-semibold text-text">{spend}</span> / {budget}
          </span>
          <span className={`ml-auto whitespace-nowrap ${restClasses}`}>{rest}</span>
        </p>
      ) : (
        <div aria-hidden="true" className="flex flex-col gap-1">
          {label && <span className="text-xs text-text-muted">{label}</span>}
          <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 tabular-nums">
            <span className="flex items-baseline gap-1.5 whitespace-nowrap">
              <span className="text-body">{approx ? "≈Rp" : "Rp"}</span>
              <span className="font-display text-[1.375rem] leading-tight font-bold">{rupiahNumber(money.spend)}</span>
              <span className="text-meta font-medium text-text-muted">/ {budget}</span>
            </span>
            <span className={`ml-auto text-meta font-medium whitespace-nowrap ${restClasses || "text-text-muted"}`}>{rest}</span>
          </p>
        </div>
      )}
      {bar && (
        <div className="h-1.5 overflow-hidden rounded-pill bg-track">
          <div
            className={`h-1.5 rounded-pill transition-[width] ${over ? "bg-day-strip" : "bg-[linear-gradient(to_right,var(--progress-from),var(--progress-to))]"}`}
            style={{ width: `${fill * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
