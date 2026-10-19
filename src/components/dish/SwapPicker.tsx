"use client";

import { formatQty } from "@/components/list/format";
import { overlineClasses } from "@/components/ui/Input";
import { radioCardClasses, radioClasses } from "@/components/ui/Radio";
import { replacementLines, type SwapRule } from "@/lib/dishes/swaps";
import type { Strings } from "@/lib/strings";
import type { Ingredient, Language } from "@/lib/types";

type Props = {
  original: Ingredient;
  rule: SwapRule;
  /** Option id, or "keep". */
  value: string;
  onChange: (value: string) => void;
  /** household size / dish servings, for the amounts shown */
  factor: number;
  name: string;
  t: Strings;
  language: Language;
  /** Show the "Swap with" heading; screen readers always get it. */
  showLegend?: boolean;
};

/** Ranked halal swaps for one ingredient, plus "Keep original". */
export function SwapPicker({ original, rule, value, onChange, factor, name, t, language, showLegend = true }: Props) {
  const label = (i: Ingredient) => (language === "id" ? (i.localName ?? i.name) : i.name);

  return (
    <fieldset className="flex flex-col gap-1">
      <legend className={showLegend ? `mb-2 ${overlineClasses}` : "sr-only"}>{t.swap.swapWith}</legend>
      {[...rule.options.map((o) => o.id), "keep"].map((id) => {
        const option = rule.options.find((o) => o.id === id);
        const title = option
          ? option.lines.length
            ? replacementLines(original, option)
                .map((l) => `${label(l)} ${formatQty(l.qty, l.unit, factor, t, language)}`)
                .join(" + ")
            : t.swap.omit
          : t.swap.keep;
        return (
          <label key={id} className={radioCardClasses(value === id)}>
            <input
              type="radio"
              name={name}
              checked={value === id}
              onChange={() => onChange(id)}
              className={`mt-0.5 ${radioClasses}`}
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-body leading-[1.4] font-medium">{title}</span>
              {option && <span className="text-xs text-text-muted">{option.note}</span>}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
