"use client";

import { Checkbox } from "@/components/ui/Checkbox";
import { Stepper } from "@/components/ui/Stepper";
import { Toggle } from "@/components/ui/Toggle";
import type { Strings } from "@/lib/strings";
import type { Language, Meal, Settings } from "@/lib/types";

const MEALS: Meal[] = ["breakfast", "lunch", "dinner"];
const LANGUAGES: { id: Language; label: string }[] = [
  { id: "id", label: "Bahasa Indonesia" },
  { id: "en", label: "English" },
];

type Props = { value: Settings; onChange: (next: Settings) => void; t: Strings };

/** Household size, halal mode, meals and language: shared by onboarding and Settings. */
export function SettingsFields({ value, onChange, t }: Props) {
  const set = (patch: Partial<Settings>) => onChange({ ...value, ...patch });
  const card = "flex flex-col gap-3 rounded-card border border-border bg-surface p-4";

  return (
    <div className="flex flex-col gap-3">
      <section className={card}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="people-label" className="text-body font-semibold">
              {t.onboarding.people}
            </h2>
            <p className="text-meta text-text-muted">{t.onboarding.peopleHint}</p>
          </div>
          <Stepper
            value={value.householdSize}
            min={1}
            max={10}
            onChange={(householdSize) => set({ householdSize })}
            decreaseLabel={t.onboarding.fewer}
            increaseLabel={t.onboarding.more}
            labelledBy="people-label"
          />
        </div>
      </section>

      <section className={card}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="halal-label" className="text-body font-semibold">
              {t.onboarding.halal}
            </h2>
            <p id="halal-hint" className="text-meta text-text-muted">
              {t.onboarding.halalHint}
            </p>
          </div>
          <Toggle
            checked={value.halalMode}
            onChange={(halalMode) => set({ halalMode })}
            labelledBy="halal-label"
            describedBy="halal-hint"
          />
        </div>
        {value.halalMode && (
          <div className="flex items-start justify-between gap-4 border-t border-fill-muted pt-3">
            <div className="flex flex-col gap-1">
              <h3 id="autoswap-label" className="text-body font-medium">
                {t.onboarding.autoSwap}
              </h3>
              <p id="autoswap-hint" className="text-meta text-text-muted">
                {t.onboarding.autoSwapHint}
              </p>
            </div>
            <Toggle
              checked={value.autoSwap}
              onChange={(autoSwap) => set({ autoSwap })}
              labelledBy="autoswap-label"
              describedBy="autoswap-hint"
            />
          </div>
        )}
      </section>

      <fieldset className={card}>
        <legend className="sr-only">{t.onboarding.meals}</legend>
        <div className="flex flex-col gap-1" aria-hidden="true">
          <span className="text-body font-semibold">{t.onboarding.meals}</span>
          <span className="text-meta text-text-muted">{t.onboarding.mealsHint}</span>
        </div>
        <div className="flex flex-col divide-y divide-fill-muted">
          {MEALS.map((meal) => {
            const on = value.meals.includes(meal);
            // Keep at least one meal planned.
            const last = on && value.meals.length === 1;
            return (
              <label key={meal} className="flex min-h-tap items-center gap-3 py-1">
                <Checkbox
                  checked={on}
                  disabled={last}
                  onChange={() =>
                    set({ meals: on ? value.meals.filter((m) => m !== meal) : MEALS.filter((m) => m === meal || value.meals.includes(m)) })
                  }
                />
                <span className="text-body">{t.meals[meal]}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className={card}>
        <legend className="sr-only">{t.onboarding.language}</legend>
        <span aria-hidden="true" className="text-body font-semibold">
          {t.onboarding.language}
        </span>
        <div className="flex rounded-row bg-fill-muted p-1">
          {LANGUAGES.map((l) => (
            <label
              key={l.id}
              className={`flex min-h-tap flex-1 cursor-pointer items-center justify-center rounded-row text-sm font-medium has-focus-visible:outline-2 ${
                value.language === l.id ? "bg-surface text-text shadow-sm" : "text-text-muted"
              }`}
            >
              <input
                type="radio"
                name="language"
                value={l.id}
                checked={value.language === l.id}
                onChange={() => set({ language: l.id })}
                className="sr-only"
              />
              {l.label}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
