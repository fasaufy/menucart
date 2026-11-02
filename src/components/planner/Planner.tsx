"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SessionBanner } from "@/components/auth/SessionBanner";
import { SignupPromptSheet } from "@/components/auth/SignupPrompt";
import { SampleBanner } from "@/components/onboarding/SampleBanner";
import { Tip } from "@/components/onboarding/Tip";
import { TabBar } from "@/components/TabBar";
import { Button, buttonClasses } from "@/components/ui/Button";
import { ArrowsClockwiseIcon } from "@/components/icons";
import { Footer } from "@/components/ui/Footer";
import { Sheet } from "@/components/ui/Sheet";
import { useAccount } from "@/lib/account";
import { getMeta } from "@/lib/db";
import { useDishes, useMeta, useRecentDishIds, useSettings, useSkippedKeys, useWeekMoney, useWeekSlots } from "@/lib/hooks";
import { autoApplySwaps, generateList, needsHalalReview } from "@/lib/list/actions";
import { formatRupiah } from "@/lib/money";
import { dishNotes } from "@/lib/list/freshness";
import { dishCost } from "@/lib/prices/price";
import { copyWeek, repeatDay, slotDishes, weekIdFor, type SlotRef } from "@/lib/plan";
import { getStrings } from "@/lib/strings";
import type { Day, Dish, Ingredient, Meal, Slot } from "@/lib/types";
import { useToday } from "@/lib/useToday";
import { addDays, dayIndex, dayName, DAYS, formatWeekRange, weekStartOf } from "@/lib/week";
import { DayPaper } from "./DayPaper";
import { DayStrip } from "./DayStrip";
import { SLOT_SHEET_TITLE_ID, SlotSheet, type MoveOption } from "./SlotSheet";
import { SlotRow } from "./SlotRow";
import { WeekHeader } from "./WeekHeader";

const MEAL_ORDER: Meal[] = ["breakfast", "lunch", "dinner"];

export function Planner() {
  const today = useToday();
  const settings = useSettings();
  const dishes = useDishes();
  const recentIds = useRecentDishIds();
  const [weekOffset, setWeekOffset] = useState(0);
  // The day on the paper; until the user picks one: today this week, Monday otherwise.
  const [dayChoice, setDayChoice] = useState<{ week: number; day: Day } | null>(null);
  // The open sheet: a dish to manage (index), or a meal to add to (no index).
  const [target, setTarget] = useState<(SlotRef & { index?: number }) | null>(null);
  // "Added to 4 days" after Repeat to all week, shown briefly in its place.
  const [repeatNote, setRepeatNote] = useState<{ day: Day; days: number } | null>(null);
  const repeatTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [generating, setGenerating] = useState(false);
  const router = useRouter();
  const account = useAccount();
  const onboarded = useMeta("onboarded");
  const lastUser = useMeta("lastUser");

  // First run goes through Welcome (guests) or onboarding (new accounts).
  // Re-read the flag before redirecting: Next keeps this page mounted while
  // hidden, so `onboarded` can be stale right after onboarding finishes.
  useEffect(() => {
    if (onboarded !== null || !account.loaded) return;
    let cancelled = false;
    getMeta("onboarded").then((fresh) => {
      if (!fresh && !cancelled) router.replace(account.signedIn ? "/onboarding" : "/");
    });
    return () => {
      cancelled = true;
    };
  }, [onboarded, account, router]);

  const currentStart = today && settings ? weekStartOf(today, settings.weekStartsOn) : null;
  const weekStart = currentStart ? addDays(currentStart, weekOffset * 7) : null;
  const slots = useWeekSlots(weekStart ? weekIdFor(weekStart) : null);
  // For "Copy last week" on an empty future week.
  const skipped = useSkippedKeys(weekStart ? weekIdFor(weekStart) : null);
  const prevSlots = useWeekSlots(weekStart && weekOffset >= 1 ? weekIdFor(addDays(weekStart, -7)) : null);
  const week = useWeekMoney(weekStart ? weekIdFor(weekStart) : null);

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
  // Past days are read-only (PRD: planning a past day).
  const todayIndex = today && settings ? dayIndex(today, settings.weekStartsOn) : 0;

  // Freshness: the week is bought in one trip, today for this week, Monday for later ones.
  const plannedDishes = (slots ?? []).filter((s) => meals.includes(s.meal)).flatMap((s) =>
    slotDishes(s).flatMap(({ dishId }) => {
      const dish = dishes?.get(dishId);
      return dish ? [{ day: s.day, dish }] : [];
    }),
  );
  const notes = dishNotes(plannedDishes, (weekOffset === 0 ? todayIndex : 0) as Day);
  const lower = (name: string) => name.charAt(0).toLowerCase() + name.slice(1);
  const ingredientName = (i: Ingredient) => lower(settings?.language === "id" ? (i.localName ?? i.name) : i.name);

  /** "≈Rp9.000 · 2 portions", plus a freshness note: the dish's share of what the week will cost. */
  const costLine = (dish: Dish | undefined, day: Day) => {
    if (!dish?.ingredients.length || !week || !settings) return undefined;
    const { cost } = dishCost(dish, week.lines, settings.householdSize, settings.city);
    const line = t.plan.dishCost(formatRupiah(cost, { estimated: true }), settings.householdSize);
    const note = notes.get(`${day}:${dish.id}`);
    if (!note) return { text: line };
    if (note.kind === "late") {
      return { text: `${line} · ${t.fresh.late(ingredientName(note.ingredient), t.fresh.range(...note.keeps))}`, warning: true };
    }
    return { text: `${line} · ${t.fresh.uses(ingredientName(note.ingredient), dayName(weekStart!, note.day, settings.language))}` };
  };
  const isEditable = (day: Day) =>
    weekOffset > 0 || (weekOffset === 0 && day >= todayIndex);
  const editableDays = DAYS.filter(isEditable);
  const selectedDay: Day =
    dayChoice?.week === weekOffset ? dayChoice.day : weekOffset === 0 ? todayIndex : 0;
  const selectDay = (day: Day) => setDayChoice({ week: weekOffset, day });

  const label = (ref: SlotRef) =>
    t.sheet.slot(dayName(weekStart!, ref.day, settings!.language), t.meals[ref.meal]);

  /** Other editable days where this day's meals would fill at least one empty meal. */
  const repeatTargets = (from: Day) => {
    const own = meals.filter((meal) => slotAt(from, meal));
    return editableDays.filter((d) => d !== from && own.some((meal) => !slotAt(d, meal)));
  };

  async function repeatToWeek(from: Day) {
    const days = await repeatDay(weekStart!, from, repeatTargets(from), meals);
    clearTimeout(repeatTimer.current);
    setRepeatNote({ day: from, days });
    repeatTimer.current = setTimeout(() => setRepeatNote(null), 2500);
  }

  function moveOptions(from: SlotRef): MoveOption[] {
    return editableDays.flatMap((day) =>
      meals
        .filter((meal) => !(day === from.day && meal === from.meal))
        .map((meal) => ({ day, meal, label: label({ day, meal }) })),
    );
  }

  return (
    <>
      <SessionBanner t={t} />
      {/* PRD: planning a second week is a moment to offer an account. */}
      <SignupPromptSheet when={weekOffset === 1 && !!prevSlots?.length} variant="secondWeek" t={t} />
      <header className="flex flex-col gap-3 px-5 pt-6 pb-3">
        <div className="flex min-h-tap items-center justify-between gap-3">
          <span className="truncate text-xs font-medium text-meal-label">
            {account.loaded
              ? account.signedIn
                ? account.email
                : t.account.guestStatus
              : // Clerk can't load offline: show who last signed in here.
                (lastUser?.email ?? t.account.guestStatus)}
          </span>
          <Link href="/settings" className={buttonClasses("secondary", false, "sm")}>
            {t.account.settings}
          </Link>
        </div>
        <WeekHeader
          title={title ?? range ?? ""}
          range={title ? range : null}
          money={ready && week ? week.money : null}
          disabled={!ready}
          t={t}
          onPrev={() => setWeekOffset((o) => o - 1)}
          onNext={() => setWeekOffset((o) => o + 1)}
        />
      </header>

      {ready && (
        <div className="flex flex-col gap-3 px-5 pt-1 pb-6">
          {weekOffset < 0 && <p className="text-meta text-text-muted">{t.plan.pastWeek}</p>}
          {slots.some((s) => s.isSample) && <SampleBanner weekId={weekIdFor(weekStart)} t={t} />}
          {weekOffset >= 1 && planned === 0 && !!prevSlots?.length && (
            <Button variant="secondary" onClick={() => copyWeek(addDays(weekStart, -7), weekStart)}>
              {t.plan.copyWeek(prevSlots.length)}
            </Button>
          )}
          {planned === 0 && editableDays.length > 0 && (
            <p className="text-body font-medium">
              {t.plan.emptyPrompt(dayName(weekStart, editableDays[0], settings.language))}
            </p>
          )}
          <div className="flex flex-col">
            <DayStrip
              weekStart={weekStart}
              selected={selectedDay}
              today={weekOffset === 0 ? todayIndex : null}
              language={settings.language}
              t={t}
              onSelect={selectDay}
            />
            <DayPaper
              date={addDays(weekStart, selectedDay)}
              note={
                weekOffset === 0 && selectedDay === todayIndex
                  ? t.plan.today
                  : isEditable(selectedDay)
                    ? null
                    : t.plan.pastDay
              }
              language={settings.language}
              onSwipe={(step) => selectDay(Math.min(6, Math.max(0, selectedDay + step)) as Day)}
            >
              {meals.map((meal, i) => {
                const day = selectedDay;
                const slot = slotAt(day, meal);
                return (
                  <SlotRow
                    key={`${day}-${meal}`}
                    meal={meal}
                    dishes={slotDishes(slot).map((d) => {
                      const dish = dishes.get(d.dishId);
                      return { ...d, dish, cost: costLine(dish, day) };
                    })}
                    isSample={!!slot?.isSample}
                    skipped={skipped}
                    editable={isEditable(day)}
                    halalMode={settings.halalMode}
                    divided={i > 0}
                    t={t}
                    onOpen={(index) => setTarget({ day, meal, index })}
                    onAdd={() => setTarget({ day, meal })}
                  />
                );
              })}
              {repeatNote?.day === selectedDay ? (
                <p role="status" className="mt-2 flex min-h-button items-center justify-center text-body font-medium text-text-muted">
                  {t.plan.repeated(repeatNote.days)}
                </p>
              ) : (
                isEditable(selectedDay) &&
                repeatTargets(selectedDay).length > 0 && (
                  <Button
                    variant="secondary"
                    className="mt-2 gap-2"
                    onClick={() => repeatToWeek(selectedDay)}
                  >
                    <ArrowsClockwiseIcon size={24} />
                    {t.plan.repeatDay}
                  </Button>
                )
              )}
            </DayPaper>
          </div>
        </div>
      )}

      <Footer>
        {planned > 0 && <Tip id="generate" t={t} />}
        {planned > 0 ? (
          <Button
            disabled={generating}
            onClick={async () => {
              setGenerating(true);
              try {
                await autoApplySwaps(weekIdFor(weekStart!));
                await generateList(weekStart!, { recordChange: true });
                const review = await needsHalalReview(weekIdFor(weekStart!));
                router.push(review ? "/review" : "/pantry");
              } finally {
                setGenerating(false);
              }
            }}
          >
            {t.plan.generate(
              formatRupiah(week?.money.spend ?? 0, { estimated: !!week?.money.missing.length }),
            )}
          </Button>
        ) : (
          <Button disabled>{t.plan.generateEmpty}</Button>
        )}
        <TabBar />
      </Footer>

      <Sheet open={!!target} onClose={() => setTarget(null)} labelledBy={SLOT_SHEET_TITLE_ID}>
        {ready && target && (
          <SlotSheet
            key={`${weekStart}-${target.day}-${target.meal}-${target.index ?? "add"}`}
            weekStart={weekStart}
            target={target}
            slot={slotAt(target.day, target.meal)}
            title={label(target)}
            dishes={dishes}
            recentIds={recentIds}
            halalMode={settings.halalMode}
            language={settings.language}
            moveOptions={moveOptions(target)}
            emptyMeals={meals.filter((m) => m !== target.meal && !slotAt(target.day, m))}
            t={t}
            onDone={() => setTarget(null)}
          />
        )}
      </Sheet>
    </>
  );
}
