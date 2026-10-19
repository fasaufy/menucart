"use client";

import { useRef, type KeyboardEvent } from "react";
import type { Strings } from "@/lib/strings";
import type { Day, Language } from "@/lib/types";
import { addDays, dayName, DAYS, parseISODate, type ISODate } from "@/lib/week";

type Props = {
  weekStart: ISODate;
  selected: Day;
  today: Day | null;
  language: Language;
  t: Strings;
  onSelect: (day: Day) => void;
};

/**
 * The red "calendar tab" strip: one tab per day, the chosen day raised in
 * white. Arrow keys move between days (tabs pattern).
 */
export function DayStrip({ weekStart, selected, today, language, t, onSelect }: Props) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: KeyboardEvent) {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = Math.min(6, Math.max(0, selected + step)) as Day;
    onSelect(next);
    refs.current[next]?.focus();
  }

  return (
    <div className="rounded-xl bg-day-strip px-1 pt-1 pb-2 shadow-[inset_0_-4px_0_rgb(0_0_0/0.12)]">
      <div
        role="tablist"
        aria-label={t.plan.days}
        onKeyDown={onKeyDown}
        className="flex h-9 rounded-lg bg-black/12 py-px shadow-[inset_0_0.5px_2px_rgb(0_0_0/0.12)]"
      >
        {DAYS.map((day) => {
          const active = day === selected;
          const date = parseISODate(addDays(weekStart, day)).getDate();
          return (
            <button
              key={day}
              ref={(el) => {
                refs.current[day] = el;
              }}
              type="button"
              role="tab"
              id={`day-tab-${day}`}
              aria-selected={active}
              aria-controls="day-panel"
              aria-label={t.plan.dayLabel(dayName(weekStart, day, language), String(date))}
              tabIndex={active ? 0 : -1}
              onClick={() => onSelect(day)}
              className={`relative flex flex-1 items-center justify-center rounded-lg text-[0.9375rem] font-medium tabular-nums ${
                active
                  ? "bg-surface text-text-strong shadow-[inset_0_-1px_0_rgb(0_0_0/0.25),0_0_2px_rgb(153_153_153/0.2)]"
                  : "text-white/80"
              }`}
            >
              {date}
              {day === today && !active && (
                <span aria-hidden="true" className="absolute bottom-0.5 size-1 rounded-pill bg-white/80" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
