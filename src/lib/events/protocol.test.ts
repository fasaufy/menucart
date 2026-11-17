import { expect, it } from "vitest";
import { cleanBatch, cleanProps } from "./protocol";

const NOW = Date.UTC(2026, 10, 17);
const ID = "1b4e28ba-2fa1-41d2-883f-0016d3cca427";

it("keeps counts, flags and short fixed values; drops free text and odd keys", () => {
  expect(
    cleanProps({
      week_start: "2026-11-16",
      dish_count: 7.4,
      budget_set: false,
      planning_seconds: null,
      dish: "Nasi goreng kampung ibu",
      Bad: 1,
      nested: { a: 1 },
      total: Infinity,
    }),
  ).toEqual({ week_start: "2026-11-16", dish_count: 7, budget_set: false, planning_seconds: null });
});

it("keeps known events, drops unknown names and bad ids, and fixes wild clocks", () => {
  const batch = cleanBatch(
    {
      guestId: ID,
      events: [
        { id: ID, name: "dish_added", props: { week_start: "2026-11-16" }, at: NOW - 1000, tester: "T03" },
        { id: ID, name: "page_view", props: {}, at: NOW },
        { id: "nope", name: "dish_added", props: {}, at: NOW },
        { id: ID, name: "list_copied", props: {}, at: NOW + 400 * 86_400_000, tester: "not a code!" },
      ],
    },
    NOW,
  );
  expect(batch).toEqual({
    guestId: ID,
    events: [
      { id: ID, name: "dish_added", props: { week_start: "2026-11-16" }, at: NOW - 1000, tester: "T03" },
      { id: ID, name: "list_copied", props: {}, at: NOW, tester: null },
    ],
  });
});

it("refuses batches that aren't a list or are too big", () => {
  expect(cleanBatch({ guestId: ID, events: "x" }, NOW)).toBeNull();
  expect(cleanBatch({ guestId: ID, events: Array(51).fill({}) }, NOW)).toBeNull();
  expect(cleanBatch({ guestId: "x", events: [] }, NOW)).toEqual({ guestId: null, events: [] });
});
