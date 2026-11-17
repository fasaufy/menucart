import { db, getMeta } from "./db";
import { track } from "./events/track";

// MenuCart Plus fake door (tester week, H4): nothing to buy, it only counts interest.

type Plus = { interestedAt?: number; listSentAt?: number; listCardSeen?: boolean };

async function update(patch: (row: Plus) => Plus) {
  const { id: _, ...row } = (await getMeta("plus")) ?? { id: "plus" as const };
  await db.meta.put({ id: "plus", ...patch(row) });
}

/** "Daftar untuk akses awal": counted once per tap, then the card says thank you. */
export async function registerPlusInterest(where: "settings" | "list") {
  await update((row) => ({ ...row, interestedAt: Date.now() }));
  void track("plus_interest", { where });
}

/** The first list sent or copied makes the one-time Plus card appear on the list. */
export function noteListSent() {
  return update((row) => (row.listSentAt ? row : { ...row, listSentAt: Date.now() })).catch(() => {});
}

export function markPlusCardSeen() {
  return update((row) => ({ ...row, listCardSeen: true }));
}
