import type { Day, Language } from "./types";

// Weeks start on the user's chosen day (Settings.weekStartsOn, Monday by
// default). A week's id is its first date; a Day is the position in it (0 =
// the first day). Dates are local calendar days as "YYYY-MM-DD"; never
// toISOString(), which shifts to UTC.

export type ISODate = string;

export const DAYS: Day[] = [0, 1, 2, 3, 4, 5, 6];

const LOCALES: Record<Language, string> = { en: "en-GB", id: "id-ID" };

export function localeFor(language: Language) {
  return LOCALES[language];
}

export function toISODate(d: Date): ISODate {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function parseISODate(iso: ISODate): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: ISODate, days: number): ISODate {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Monday, as Date.getDay() counts (0 = Sunday … 6 = Saturday). */
export const MONDAY = 1;

/** Position of a date in its week: 0 = the week's first day. */
export function dayIndex(iso: ISODate, startsOn = MONDAY): Day {
  return ((parseISODate(iso).getDay() - startsOn + 7) % 7) as Day;
}

/** The first day of the week a date falls in. */
export function weekStartOf(iso: ISODate, startsOn = MONDAY): ISODate {
  return addDays(iso, -dayIndex(iso, startsOn));
}

export function dayName(weekStart: ISODate, day: Day, language: Language) {
  return new Intl.DateTimeFormat(LOCALES[language], { weekday: "long" }).format(
    parseISODate(addDays(weekStart, day)),
  );
}

/** "Tue", "Sel": for short notes like "Cook Tue". */
export function shortDayName(weekStart: ISODate, day: Day, language: Language) {
  return new Intl.DateTimeFormat(LOCALES[language], { weekday: "short" }).format(
    parseISODate(addDays(weekStart, day)),
  );
}

/** "Mon 12 – Sun 18 Oct", or "Mon 28 Sep – Sun 4 Oct" across months */
export function formatWeekRange(weekStart: ISODate, language: Language) {
  const locale = LOCALES[language];
  const start = parseISODate(weekStart);
  const end = parseISODate(addDays(weekStart, 6));
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const month = new Intl.DateTimeFormat(locale, { month: "short" });
  const startMonth =
    start.getMonth() === end.getMonth() ? "" : ` ${month.format(start)}`;
  return `${weekday.format(start)} ${start.getDate()}${startMonth} – ${weekday.format(end)} ${end.getDate()} ${month.format(end)}`;
}
