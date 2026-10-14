"use client";

import { formatQty } from "@/components/list/format";
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
};

/** Ranked halal swaps for one ingredient, plus "Keep original". */
export function SwapPicker({ original, rule, value, onChange, factor, name, t, language }: Props) {
  const label = (i: Ingredient) => (language === "id" ? (i.localName ?? i.name) : i.name);

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-xs font-semibold tracking-wide text-text-muted uppercase">
        {t.swap.swapWith}
      </legend>
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
          <label
            key={id}
            className={`flex min-h-tap items-start gap-3 rounded-row border px-3.5 py-3 ${
              value === id ? "border-text bg-surface" : "border-border bg-surface"
            }`}
          >
            <input
              type="radio"
              name={name}
              checked={value === id}
              onChange={() => onChange(id)}
              className="mt-0.5 size-5 shrink-0 accent-text"
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-body font-medium">{title}</span>
              {option && <span className="text-xs text-text-muted">{option.note}</span>}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
