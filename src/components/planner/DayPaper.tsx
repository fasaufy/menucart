"use client";

import { useRef, type ReactNode, type TouchEvent } from "react";
import calendarBg from "@/assets/calendar-bg.svg";
import type { Language } from "@/lib/types";
import { localeFor, parseISODate, type ISODate } from "@/lib/week";

type Props = {
  date: ISODate;
  /** "Today", "Past" or nothing. */
  note: string | null;
  language: Language;
  onSwipe: (step: 1 | -1) => void;
  children: ReactNode;
};

/**
 * One day as a sheet of a tear-off calendar: month, a big date, then the
 * day's meals. Swipe sideways to move between days.
 */
export function DayPaper({ date, note, language, onSwipe, children }: Props) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const d = parseISODate(date);
  const locale = localeFor(language);
  const month = new Intl.DateTimeFormat(locale, { month: "long" }).format(d);
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "long" }).format(d);

  function onTouchEnd(e: TouchEvent) {
    const from = start.current;
    start.current = null;
    const touch = e.changedTouches[0];
    if (!from || !touch) return;
    const dx = touch.clientX - from.x;
    const dy = touch.clientY - from.y;
    // A clear sideways swipe only; vertical scrolling wins otherwise.
    if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.5) onSwipe(dx < 0 ? 1 : -1);
  }

  return (
    <div
      id="day-panel"
      role="tabpanel"
      aria-labelledby={`day-tab-${(d.getDay() + 6) % 7}`}
      onTouchStart={(e) => {
        const touch = e.touches[0];
        start.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
      }}
      onTouchEnd={onTouchEnd}
      className="mx-auto flex w-full max-w-[330px] flex-col gap-2 bg-surface p-2 shadow-paper"
    >
      <div key={date} className="relative flex min-h-[166px] flex-col items-center justify-center gap-6 overflow-hidden p-4.5 motion-safe:animate-[paper-in_220ms_ease-out]">
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG, precached for offline */}
        <img src={calendarBg.src} alt="" className="absolute inset-0 size-full object-cover" />
        <p className="relative flex flex-col items-center gap-2.5 font-display font-bold">
          <span className="text-[1.1875rem] leading-[1.4]">{month}</span>
          {/* Full line box so the clipped gradient covers whole digits; the negative
              margin pulls it back to the design's cap-height spacing. */}
          <span className="-my-[0.14em] bg-[linear-gradient(to_bottom,#2d2d2d,#1b1b1b)] bg-clip-text px-[0.04em] text-[4.5rem] leading-none tracking-[-0.04em] text-transparent tabular-nums">
            {d.getDate()}
          </span>
        </p>
        <p className="relative text-xs font-medium">
          {weekday}
          {note && ` · ${note}`}
        </p>
      </div>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}
