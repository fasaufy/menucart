"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SessionBanner } from "@/components/auth/SessionBanner";
import { SignupPromptSheet } from "@/components/auth/SignupPrompt";
import { SampleBanner } from "@/components/onboarding/SampleBanner";
import { Tip } from "@/components/onboarding/Tip";
import { TabBar } from "@/components/TabBar";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Footer } from "@/components/ui/Footer";
import { Sheet } from "@/components/ui/Sheet";
import { useAccount } from "@/lib/account";
import { getMeta } from "@/lib/db";
import { useDishes, useMeta, useRecentDishIds, useSettings, useSkippedKeys, useWeekSlots } from "@/lib/hooks";
import { autoApplySwaps, generateList, needsHalalReview } from "@/lib/list/actions";
import { copyWeek, repeatMeal, weekIdFor, type SlotRef } from "@/lib/plan";
import { getStrings } from "@/lib/strings";
import type { Day, Meal, Slot } from "@/lib/types";
import { useSyncStatus } from "@/lib/sync/useSyncStatus";
import { useToday } from "@/lib/useToday";
import { addDays, dayName, dayOfWeek, DAYS, formatWeekRange, mondayOf } from "@/lib/week";
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
  const [target, setTarget] = useState<SlotRef | null>(null);
  const [generating, setGenerating] = useState(false);
  const router = useRouter();
  const account = useAccount();
  const onboarded = useMeta("onboarded");
  const lastUser = useMeta("lastUser");
  const syncState = useSyncStatus();

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

  const currentMonday = today ? mondayOf(today) : null;
  const weekStart = currentMonday ? addDays(currentMonday, weekOffset * 7) : null;
  const slots = useWeekSlots(weekStart ? weekIdFor(weekStart) : null);
  // For "Copy last week" on an empty future week.
  const skipped = useSkippedKeys(weekStart ? weekIdFor(weekStart) : null);
  const prevSlots = useWeekSlots(weekStart && weekOffset >= 1 ? weekIdFor(addDays(weekStart, -7)) : null);

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
  const selectedDay: Day =
    dayChoice?.week === weekOffset ? dayChoice.day : weekOffset === 0 ? todayIndex : 0;
  const selectDay = (day: Day) => setDayChoice({ week: weekOffset, day });

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
          planned={planned}
          total={total}
          status={
            ready
              ? account.loaded && account.signedIn && syncState === "synced"
                ? t.plan.synced
                : t.plan.saved
              : null
          }
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
                const editable = isEditable(day);
                const slot = slotAt(day, meal);
                // Breakfast often repeats, so it gets the shortcut on the row (wireframe);
                // lunch and dinner offer it in the slot sheet.
                const repeatDays = emptyDaysFor(meal, day);
                const canRepeat =
                  meal === "breakfast" && editable && !!slot?.dishId && repeatDays.length > 0;
                return (
                  <SlotRow
                    key={`${day}-${meal}`}
                    meal={meal}
                    slot={slot}
                    dish={dishes.get(slot?.dishId)}
                    skipped={skipped}
                    editable={editable}
                    halalMode={settings.halalMode}
                    divided={i > 0}
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
        <TabBar />
      </Footer>

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
