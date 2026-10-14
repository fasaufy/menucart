"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SessionBanner } from "@/components/auth/SessionBanner";
import { SampleBanner } from "@/components/onboarding/SampleBanner";
import { Tip } from "@/components/onboarding/Tip";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { useAccount } from "@/lib/account";
import { useDishes, useMeta, useRecentDishIds, useSettings, useWeekSlots } from "@/lib/hooks";
import { generateList, needsHalalReview } from "@/lib/list/actions";
import { repeatMeal, weekIdFor, type SlotRef } from "@/lib/plan";
import { getStrings } from "@/lib/strings";
import type { Day, Meal, Slot } from "@/lib/types";
import { useToday } from "@/lib/useToday";
import { addDays, dayName, dayOfWeek, DAYS, formatWeekRange, mondayOf } from "@/lib/week";
import { SLOT_SHEET_TITLE_ID, SlotSheet, type MoveOption } from "./SlotSheet";
import { SlotRow } from "./SlotRow";

const MEAL_ORDER: Meal[] = ["breakfast", "lunch", "dinner"];

export function Planner() {
  const today = useToday();
  const settings = useSettings();
  const dishes = useDishes();
  const recentIds = useRecentDishIds();
  const [weekOffset, setWeekOffset] = useState(0);
  const [target, setTarget] = useState<SlotRef | null>(null);
  const [generating, setGenerating] = useState(false);
  const router = useRouter();
  const account = useAccount();
  const onboarded = useMeta("onboarded");
  const lastUser = useMeta("lastUser");

  // First run goes through Welcome (guests) or onboarding (new accounts).
  useEffect(() => {
    if (onboarded !== null || !account.loaded) return;
    router.replace(account.signedIn ? "/onboarding" : "/");
  }, [onboarded, account, router]);

  const currentMonday = today ? mondayOf(today) : null;
  const weekStart = currentMonday ? addDays(currentMonday, weekOffset * 7) : null;
  const slots = useWeekSlots(weekStart ? weekIdFor(weekStart) : null);

  const t = getStrings(settings?.language);
  const ready = today && weekStart && settings && dishes && slots && recentIds;

  const title =
    weekOffset === 0
      ? t.plan.thisWeek
      : weekOffset === 1
        ? t.plan.nextWeek
        : weekOffset === -1
          ? t.plan.lastWeek
          : null;
  const range = weekStart ? formatWeekRange(weekStart, settings?.language ?? "en") : null;

  const meals = MEAL_ORDER.filter((m) => settings?.meals.includes(m));
  const slotAt = (day: Day, meal: Meal): Slot | undefined =>
    slots?.find((s) => s.day === day && s.meal === meal);
  const planned = slots?.filter((s) => meals.includes(s.meal)).length ?? 0;
  const total = DAYS.length * meals.length;

  // Past days are read-only (PRD: planning a past day).
  const todayIndex = today ? dayOfWeek(today) : 0;
  const isEditable = (day: Day) =>
    weekOffset > 0 || (weekOffset === 0 && day >= todayIndex);
  const editableDays = DAYS.filter(isEditable);

  const label = (ref: SlotRef) =>
    t.sheet.slot(dayName(weekStart!, ref.day, settings!.language), t.meals[ref.meal]);

  /** Editable days (other than `except`) with nothing planned for this meal. */
  const emptyDaysFor = (meal: Meal, except: Day) =>
    editableDays.filter((d) => d !== except && !slotAt(d, meal));

  function moveOptions(from: SlotRef): MoveOption[] {
    return editableDays.flatMap((day) =>
      meals
        .filter((meal) => !(day === from.day && meal === from.meal))
        .map((meal) => {
          const other = slotAt(day, meal);
          const base = label({ day, meal });
          return {
            day,
            meal,
            label: other ? `${base} (${t.sheet.swapWith(other.dishName)})` : base,
          };
        }),
    );
  }

  return (
    <>
      <SessionBanner t={t} />
      <header className="flex flex-col gap-3 px-5 pt-6 pb-3">
        <div className="flex min-h-tap items-center justify-between gap-3">
          <span className="truncate text-xs text-text-muted">
            {account.loaded
              ? account.signedIn
                ? account.email
                : t.account.guestStatus
              : // Clerk can't load offline: show who last signed in here.
                (lastUser?.email ?? t.account.guestStatus)}
          </span>
          <Link
            href="/settings"
            className="-mr-2 flex min-h-tap shrink-0 items-center px-2 text-sm text-text-muted underline underline-offset-4"
          >
            {t.account.settings}
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label={t.plan.prevWeekLabel}
            onClick={() => setWeekOffset((o) => o - 1)}
            disabled={!ready}
            className="-ml-3 grid size-tap place-items-center"
          >
            <ChevronLeftIcon size={22} />
          </button>
          <div className="flex flex-col items-center gap-0.5 text-center">
            <h1 className="text-xl font-semibold">{title ?? range}</h1>
            <p className="min-h-[1lh] text-meta text-text-muted">{title ? range : null}</p>
          </div>
          <button
            type="button"
            aria-label={t.plan.nextWeekLabel}
            onClick={() => setWeekOffset((o) => o + 1)}
            disabled={!ready}
            className="-mr-3 grid size-tap place-items-center"
          >
            <ChevronRightIcon size={22} />
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex min-h-[1lh] justify-between text-meta text-text-muted">
            {ready && (
              <>
                <span>{t.plan.progress(planned, total)}</span>
                <span>{t.plan.saved}</span>
              </>
            )}
          </div>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={planned}
            aria-label={ready ? t.plan.progress(planned, total) : undefined}
            className="h-1.5 rounded-pill bg-track"
          >
            <div
              className="h-1.5 rounded-pill bg-text"
              style={{ width: total ? `${(planned / total) * 100}%` : 0 }}
            />
          </div>
        </div>
      </header>

      {ready && (
        <div className="flex flex-col gap-4.5 px-5 pt-1 pb-6">
          {weekOffset < 0 && <p className="text-meta text-text-muted">{t.plan.pastWeek}</p>}
          {slots.some((s) => s.isSample) && <SampleBanner weekId={weekIdFor(weekStart)} t={t} />}
          {planned === 0 && editableDays.length > 0 && (
            <p className="text-body font-medium">
              {t.plan.emptyPrompt(dayName(weekStart, editableDays[0], settings.language))}
            </p>
          )}
          {DAYS.map((day) => {
            const editable = isEditable(day);
            const isToday = weekOffset === 0 && day === todayIndex;
            return (
              <section key={day} aria-labelledby={`day-${day}`} className="flex flex-col gap-2">
                <h2 id={`day-${day}`} className="text-sm font-semibold">
                  {dayName(weekStart, day, settings.language)}
                  {isToday && (
                    <span className="font-normal text-text-muted"> · {t.plan.today}</span>
                  )}
                </h2>
                {meals.map((meal) => {
                  const slot = slotAt(day, meal);
                  // Breakfast often repeats, so it gets the shortcut on the row (wireframe);
                  // lunch and dinner offer it in the slot sheet.
                  const repeatDays = emptyDaysFor(meal, day);
                  const canRepeat =
                    meal === "breakfast" && editable && !!slot?.dishId && repeatDays.length > 0;
                  return (
                    <SlotRow
                      key={meal}
                      meal={meal}
                      slot={slot}
                      dish={dishes.get(slot?.dishId)}
                      editable={editable}
                      halalMode={settings.halalMode}
                      t={t}
                      onOpen={() => setTarget({ day, meal })}
                      onRepeat={
                        canRepeat
                          ? () =>
                              repeatMeal(weekStart, meal, repeatDays, {
                                id: slot.dishId!,
                                name: slot.dishName,
                              })
                          : undefined
                      }
                    />
                  );
                })}
              </section>
            );
          })}
        </div>
      )}

      <div className="sticky bottom-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom))] mt-auto flex flex-col gap-2 border-t border-divider bg-bg px-5 py-3">
        {planned > 0 && <Tip id="generate" t={t} />}
        {planned > 0 ? (
          <Button
            disabled={generating}
            onClick={async () => {
              setGenerating(true);
              try {
                await generateList(weekStart!);
                const review = await needsHalalReview(weekIdFor(weekStart!));
                router.push(review ? "/review" : "/pantry");
              } finally {
                setGenerating(false);
              }
            }}
          >
            {t.plan.generate(planned)}
          </Button>
        ) : (
          <Button disabled>{t.plan.generateEmpty}</Button>
        )}
      </div>

      <Sheet open={!!target} onClose={() => setTarget(null)} labelledBy={SLOT_SHEET_TITLE_ID}>
        {ready && target && (
          <SlotSheet
            key={`${weekStart}-${target.day}-${target.meal}`}
            weekStart={weekStart}
            target={target}
            slot={slotAt(target.day, target.meal)}
            title={label(target)}
            dishes={dishes}
            recentIds={recentIds}
            halalMode={settings.halalMode}
            language={settings.language}
            moveOptions={moveOptions(target)}
            repeatDays={emptyDaysFor(target.meal, target.day)}
            t={t}
            onDone={() => setTarget(null)}
          />
        )}
      </Sheet>
    </>
  );
}
