import { db, getMeta } from "../db";
import { MAX_BATCH, TESTER_CODE, type EventName, type EventProps } from "./protocol";

// Usage events for the tester week: written to the device first, sent in
// batches when online. Never blocks or fails a user action.

/**
 * Records an event. Fire and forget: `void track(...)` from any handler.
 * The tester code is read now, so events made before a code arrives stay without one.
 */
export async function track(name: EventName, props: EventProps = {}) {
  try {
    const tester = (await getMeta("tester"))?.code ?? null;
    await db.events.add({ id: crypto.randomUUID(), name, props, at: Date.now(), tester });
    scheduleFlush();
  } catch {
    // Storage full or blocked: measurement must never get in the way.
  }
}

/** This device's random id; made on first use. */
export async function guestId() {
  const row = await getMeta("device");
  if (row) return row.guestId;
  const id = crypto.randomUUID();
  await db.meta.put({ id: "device", guestId: id });
  return id;
}

/** Saves the tester code from an invite link (?t=rina). Returns true when the URL had one. */
export async function captureTesterCode(search: string) {
  const code = new URLSearchParams(search).get("t");
  if (!code || !TESTER_CODE.test(code)) return false;
  await db.meta.put({ id: "tester", code });
  return true;
}

let timer: ReturnType<typeof setTimeout> | undefined;
let flushing = false;

export function scheduleFlush(delay = 3_000) {
  clearTimeout(timer);
  timer = setTimeout(() => void flushEvents(), delay);
}

/** Sends queued events, oldest first. Stops at the first failure; the queue waits for the next try. */
export async function flushEvents() {
  if (flushing || (typeof navigator !== "undefined" && !navigator.onLine)) return;
  flushing = true;
  try {
    const id = await guestId();
    for (;;) {
      const batch = await db.events.orderBy("at").limit(MAX_BATCH).toArray();
      if (!batch.length) break;
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ guestId: id, events: batch }),
        keepalive: true,
      });
      // A batch the server can't read would block the queue forever: drop it. Retry the rest later.
      if (!res.ok && !(res.status >= 400 && res.status < 500 && res.status !== 429)) break;
      await db.events.bulkDelete(batch.map((e) => e.id));
    }
  } catch {
    // Offline or the server is down: try again later.
  } finally {
    flushing = false;
  }
}

/** First dish added to a week: the start of planning time (H2). */
export async function markPlanningStart(weekStart: string) {
  const row = (await getMeta("planning")) ?? { id: "planning" as const, weeks: {} };
  if (row.weeks[weekStart]?.firstDishAt) return;
  row.weeks[weekStart] = { ...row.weeks[weekStart], firstDishAt: Date.now() };
  await db.meta.put(row);
}

/**
 * A list was made for a week. The first time per week it is also "week_planned",
 * with the minutes since the first dish was added (none if every dish came from the sample).
 */
export async function trackListGenerated(weekStart: string, props: { dish_count: number; total: number; budget_set: boolean }) {
  try {
    await track("list_generated", { week_start: weekStart, ...props });
    const row = (await getMeta("planning")) ?? { id: "planning" as const, weeks: {} };
    const week = row.weeks[weekStart] ?? {};
    if (week.plannedAt) return;
    const now = Date.now();
    row.weeks[weekStart] = { ...week, plannedAt: now };
    await db.meta.put(row);
    await track("week_planned", {
      week_start: weekStart,
      dish_count: props.dish_count,
      planning_seconds: week.firstDishAt ? Math.round((now - week.firstDishAt) / 1000) : null,
    });
  } catch {
    // never in the way
  }
}
