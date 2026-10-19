"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertIcon, InfoIcon } from "@/components/icons";
import { formatQty } from "@/components/list/format";
import { Tip } from "@/components/onboarding/Tip";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { Footer } from "@/components/ui/Footer";
import { Group, GroupHeader } from "@/components/ui/Group";
import { setSwapChoices } from "@/lib/dishes/edit";
import { SWAP_RULES } from "@/lib/dishes/swaps";
import { useActiveList } from "@/lib/hooks";
import { generateList, type PlannedMeal } from "@/lib/list/actions";
import { getStrings } from "@/lib/strings";
import type { Dish } from "@/lib/types";
import { dayName } from "@/lib/week";
import { SwapPicker } from "./SwapPicker";

/**
 * Halal review between Generate and the pantry check (wireframe 04). One card
 * per dish with a non-halal ingredient; the top-ranked swap is preselected.
 */
export function ReviewScreen() {
  const router = useRouter();
  const list = useActiveList();
  const language = list?.settings.language ?? "en";
  const t = getStrings(language);
  // Only what the user changed here; everything else shows the saved choice or the top swap.
  const [picked, setPicked] = useState<Record<string, Record<string, string>>>({});
  const [applying, setApplying] = useState(false);

  const dishes = list ? flaggedDishes(list.meals) : [];
  const choiceFor = (dish: Dish, key: string) =>
    picked[dish.id]?.[key] ?? dish.swaps?.[key] ?? SWAP_RULES.get(key)!.options[0].id;

  async function apply() {
    if (!list) return;
    setApplying(true);
    try {
      for (const { dish } of dishes) {
        const choices = Object.fromEntries(
          nonHalal(dish).map((i) => [i.key, choiceFor(dish, i.key)]),
        );
        await setSwapChoices(dish, choices);
      }
      await generateList(list.weekId);
      router.push("/pantry");
    } finally {
      setApplying(false);
    }
  }

  return (
    <>
      <header className="flex flex-col gap-5 px-5 pt-6 pb-2">
        <BackButton href="/plan" label={t.swap.back} />
        {list && (
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-2xl leading-tight font-semibold">
              {dishes.length ? t.swap.title(dishes.length) : t.swap.noneTitle}
            </h1>
            <p className="text-sm text-text-muted">{dishes.length ? t.swap.hint : t.swap.noneHint}</p>
          </div>
        )}
      </header>

      {list && (
        <div className="flex flex-col gap-4 px-5 pt-3 pb-6">
          {dishes.map(({ dish, slots }) => {
            const factor = list.settings.householdSize / dish.servings;
            const checks = dish.ingredients.filter((i) => i.halal === "check");
            const first = slots[0];
            return (
              <Group key={dish.id} aria-labelledby={`review-${dish.id}`}>
                <GroupHeader className="items-baseline">
                  <h2 id={`review-${dish.id}`} className="text-base leading-[1.35] font-semibold">
                    {dish.name}
                  </h2>
                  <span className="shrink-0 text-xs text-text-muted">
                    {t.sheet.slot(dayName(list.weekId, first.day, language), t.meals[first.meal])}
                    {slots.length > 1 && ` ${t.swap.more(slots.length - 1)}`}
                  </span>
                </GroupHeader>

                {nonHalal(dish).map((ing) => {
                  const rule = SWAP_RULES.get(ing.key)!;
                  return (
                    <div key={ing.key} className="flex flex-col gap-1">
                      <p className="flex items-start gap-2 rounded-row border border-halal-flag-border bg-halal-flag-bg px-3 py-2 text-sm leading-[1.4] font-medium text-halal-flag-text">
                        <AlertIcon size={16} className="mt-0.5 shrink-0" />
                        <span>
                          {t.halal.non_halal}: {ing.name} {formatQty(ing.qty, ing.unit, factor, t, language)} · {rule.role}
                        </span>
                      </p>
                      <SwapPicker
                        original={ing}
                        rule={rule}
                        value={choiceFor(dish, ing.key)}
                        onChange={(v) =>
                          setPicked((p) => ({ ...p, [dish.id]: { ...p[dish.id], [ing.key]: v } }))
                        }
                        factor={factor}
                        name={`${dish.id}-${ing.key}`}
                        t={t}
                        language={language}
                        showLegend={false}
                      />
                    </div>
                  );
                })}

                {checks.map((ing) => (
                  <p key={ing.key} className="flex items-start gap-2 px-3.5 py-3 text-sm text-text-muted">
                    <InfoIcon size={16} className="mt-0.5 shrink-0" />
                    {t.swap.checkNote(ing.name)}
                  </p>
                ))}
              </Group>
            );
          })}

          <Tip id="halal" t={t} />
        </div>
      )}

      <Footer>
        <Button onClick={apply} disabled={!list || applying}>
          {dishes.length ? t.swap.apply : t.swap.continue}
        </Button>
        <p className="text-center text-xs text-text-muted">{t.swap.disclaimer}</p>
      </Footer>
    </>
  );
}

function nonHalal(dish: Dish) {
  return dish.ingredients.filter((i) => i.halal === "non_halal" && SWAP_RULES.has(i.key));
}

/** Unique dishes with a non-halal ingredient, with the slots they're planned in. */
function flaggedDishes(meals: PlannedMeal[]) {
  const byId = new Map<string, { dish: Dish; slots: PlannedMeal[] }>();
  for (const m of meals) {
    if (!nonHalal(m.dish).length) continue;
    const entry = byId.get(m.dish.id);
    if (entry) entry.slots.push(m);
    else byId.set(m.dish.id, { dish: m.dish, slots: [m] });
  }
  return [...byId.values()];
}
