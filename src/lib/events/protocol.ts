// Usage events for the tester week, shared by the device and /api/events.
// Props carry only weeks, counts, totals and fixed choices: never dish names,
// notes, emails or places. The server drops anything else.

export const EVENT_NAMES = [
  "onboarding_completed",
  "dish_added",
  "list_generated",
  "pantry_checked",
  "list_sent_whatsapp",
  "list_copied",
  "item_ticked_while_shopping",
  "week_planned",
  "plus_interest",
] as const;
export type EventName = (typeof EVENT_NAMES)[number];

export type EventProps = Record<string, string | number | boolean | null>;

/** One event as the device queues and sends it. `at` is the device's clock (ms). */
export type AppEvent = { id: string; name: EventName; props: EventProps; at: number; tester?: string | null };

export type EventBatch = { guestId: string; events: AppEvent[] };

export const MAX_BATCH = 50;
const MAX_PROPS = 10;
/** Short fixed values only ("2026-11-16", "library", "settings"), so free text can't slip in. */
const VALUE = /^[\w.:-]{0,32}$/;
const KEY = /^[a-z_]{1,32}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** Tester codes from invite links: ?t=rina or ?t=T03. */
export const TESTER_CODE = /^[A-Za-z0-9_-]{1,32}$/;

export const isEventName = (name: unknown): name is EventName => EVENT_NAMES.includes(name as EventName);
export const isUuid = (id: unknown): id is string => typeof id === "string" && UUID.test(id);

/** The props the server keeps: known shapes only, the rest dropped. */
export function cleanProps(props: unknown): EventProps {
  const out: EventProps = {};
  if (!props || typeof props !== "object" || Array.isArray(props)) return out;
  for (const [key, value] of Object.entries(props).slice(0, MAX_PROPS)) {
    if (!KEY.test(key)) continue;
    if (value === null || typeof value === "boolean") out[key] = value;
    else if (typeof value === "number" && Number.isFinite(value)) out[key] = Math.round(value);
    else if (typeof value === "string" && VALUE.test(value)) out[key] = value;
  }
  return out;
}

/** Validates a batch from a device; returns the events worth storing. */
export function cleanBatch(body: unknown, now: number): { guestId: string | null; events: (AppEvent & { tester: string | null })[] } | null {
  if (!body || typeof body !== "object") return null;
  const { guestId, events } = body as Partial<EventBatch>;
  if (!Array.isArray(events) || events.length > MAX_BATCH) return null;
  const DAY = 86_400_000;
  return {
    guestId: isUuid(guestId) ? guestId : null,
    events: events.flatMap((e) => {
      if (!e || !isUuid(e.id) || !isEventName(e.name)) return [];
      // A wrong phone clock shouldn't put events years away: keep the last 60 days, else now.
      const at = typeof e.at === "number" && e.at > now - 60 * DAY && e.at < now + DAY ? e.at : now;
      const tester = typeof e.tester === "string" && TESTER_CODE.test(e.tester) ? e.tester : null;
      return [{ id: e.id, name: e.name, props: cleanProps(e.props), at, tester }];
    }),
  };
}
