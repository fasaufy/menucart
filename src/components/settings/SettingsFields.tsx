"use client";

import { Checkbox } from "@/components/ui/Checkbox";
import { Card, Group, GroupHeader, rowDivider } from "@/components/ui/Group";
import { Stepper } from "@/components/ui/Stepper";
import { Toggle } from "@/components/ui/Toggle";
import type { Strings } from "@/lib/strings";
import type { Language, Meal, Settings } from "@/lib/types";

const MEALS: Meal[] = ["breakfast", "lunch", "dinner"];
const LANGUAGES: { id: Language; label: string }[] = [
  { id: "en", label: "English" },
  { id: "id", label: "Bahasa Indonesia" },
];

type Props = { value: Settings; onChange: (next: Settings) => void; t: Strings };

function Heading({ id, title, hint, hintId }: { id?: string; title: string; hint?: string; hintId?: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <h2 id={id} className="text-body leading-[1.4] font-medium">
        {title}
      </h2>
      {hint && (
        <p id={hintId} className="text-meta text-text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

/** Household size, halal mode, meals and language: shared by onboarding and Settings. */
export function SettingsFields({ value, onChange, t }: Props) {
  const set = (patch: Partial<Settings>) => onChange({ ...value, ...patch });

  return (
    <div className="flex flex-col gap-3">
      <Group>
        <GroupHeader>
          <Heading id="people-label" title={t.onboarding.people} hint={t.onboarding.peopleHint} />
        </GroupHeader>
        <Card>
          <Stepper
            value={value.householdSize}
            min={1}
            max={10}
            onChange={(householdSize) => set({ householdSize })}
            decreaseLabel={t.onboarding.fewer}
            increaseLabel={t.onboarding.more}
            labelledBy="people-label"
          />
        </Card>
      </Group>

      <Group className="gap-0">
        <div className="flex items-start gap-3 px-3.5 py-3">
          <Heading id="halal-label" title={t.onboarding.halal} hint={t.onboarding.halalHint} hintId="halal-hint" />
          <Toggle
            checked={value.halalMode}
            onChange={(halalMode) => set({ halalMode })}
            labelledBy="halal-label"
            describedBy="halal-hint"
          />
        </div>
        {value.halalMode && (
          <div className={`flex items-start gap-3 px-3.5 py-3 ${rowDivider}`}>
            <Heading id="autoswap-label" title={t.onboarding.autoSwap} hint={t.onboarding.autoSwapHint} hintId="autoswap-hint" />
            <Toggle
              checked={value.autoSwap}
              onChange={(autoSwap) => set({ autoSwap })}
              labelledBy="autoswap-label"
              describedBy="autoswap-hint"
            />
          </div>
        )}
      </Group>

      <Group>
        <fieldset className="contents">
          <legend className="sr-only">{t.onboarding.meals}</legend>
          <GroupHeader>
            <div aria-hidden="true" className="contents">
              <Heading title={t.onboarding.meals} hint={t.onboarding.mealsHint} />
            </div>
          </GroupHeader>
          <Card className="py-0">
            {MEALS.map((meal, i) => {
              const on = value.meals.includes(meal);
              // Keep at least one meal planned.
              const last = on && value.meals.length === 1;
              return (
                <label key={meal} className={`flex min-h-tap items-center gap-3 py-2.5 ${i ? rowDivider : ""}`}>
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
          </Card>
        </fieldset>
      </Group>

      <Group>
        <fieldset className="contents">
          <legend className="sr-only">{t.onboarding.language}</legend>
          <GroupHeader>
            <span aria-hidden="true" className="text-body font-medium">
              {t.onboarding.language}
            </span>
          </GroupHeader>
          <div className="flex min-h-15 rounded-card bg-fill-muted p-1">
            {LANGUAGES.map((l) => (
              <label
                key={l.id}
                className={`flex flex-1 cursor-pointer items-center justify-center rounded-xl px-2 text-center text-[0.9375rem] font-medium has-focus-visible:outline-2 has-focus-visible:outline-accent ${
                  value.language === l.id ? "bg-surface text-text-strong shadow-button" : "text-text-quiet"
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
      </Group>
    </div>
  );
}
