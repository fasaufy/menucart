"use client";

import { useState } from "react";
import { Card, Group } from "@/components/ui/Group";
import { chipClasses } from "@/components/ui/Input";
import { formatRb, parseRupiah, rupiahNumber } from "@/lib/money";
import type { Strings } from "@/lib/strings";

const SHORTCUTS = [150_000, 200_000, 250_000, 300_000];
/** Below Rp50rb a person (Rp100rb for two) gets a gentle note, never a block. */
const LOW_PER_PERSON = 50_000;
const MAX = 99_999_999;

type Props = {
  value: number;
  householdSize: number;
  onChange: (amount: number) => void;
  t: Strings;
};

/**
 * Weekly budget (onboarding P2, Settings): a free amount with Rp prefix and
 * shortcut chips that fill it. Chips never limit what can be typed.
 */
export function BudgetField({ value, householdSize, onChange, t }: Props) {
  // The typed text, so the field can be empty mid-edit; the saved value stays the last real amount.
  const [text, setText] = useState(value ? rupiahNumber(value) : "");
  const low = value > 0 && value < LOW_PER_PERSON * householdSize;

  function type(raw: string) {
    const amount = Math.min(parseRupiah(raw), MAX);
    setText(amount ? rupiahNumber(amount) : "");
    if (amount) onChange(amount);
  }

  function pick(amount: number) {
    setText(rupiahNumber(amount));
    onChange(amount);
  }

  return (
    <Group className="gap-0">
      <Card className="gap-3">
        <label htmlFor="weekly-budget" className="text-meta text-text-muted">
          {t.budget.label}
        </label>
        <div className="flex items-baseline gap-1.5">
          <span aria-hidden="true" className="text-body text-text">
            Rp
          </span>
          <input
            id="weekly-budget"
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="done"
            value={text}
            onChange={(e) => type(e.target.value)}
            onBlur={() => setText(rupiahNumber(value))}
            aria-describedby="budget-hint"
            aria-invalid={low || undefined}
            placeholder="0"
            // Grows with the amount so "/ week" sits right after it: digits are 1ch
            // (tabular), the grouping dots much narrower.
            style={{ width: `${fieldWidth(text)}ch` }}
            className="min-w-[2ch] bg-transparent font-display text-[1.75rem] leading-tight font-bold tabular-nums caret-accent outline-none placeholder:text-text-muted/50"
          />
          <span className="text-body text-text-muted">{t.budget.perWeek}</span>
        </div>
        <div role="group" aria-label={t.budget.shortcuts} className="flex flex-wrap gap-2">
          {SHORTCUTS.map((amount) => (
            <button
              key={amount}
              type="button"
              aria-pressed={value === amount}
              onClick={() => pick(amount)}
              className={`${chipClasses} min-w-16`}
            >
              {formatRb(amount)}
            </button>
          ))}
        </div>
      </Card>
      <p id="budget-hint" aria-live="polite" className={`px-3.5 py-3 text-meta ${low ? "text-halal-flag-text" : "text-text-muted"}`}>
        {low ? t.budget.low(`Rp${formatRb(value)}`, householdSize) : t.budget.hint}
      </p>
    </Group>
  );
}

function fieldWidth(text: string) {
  const digits = text.replace(/\D/g, "").length;
  return Math.max(digits, 1) + (text.length - digits) * 0.3 + 0.15;
}
