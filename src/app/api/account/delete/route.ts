import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { currentUserId } from "@/server/auth";
import { getDb, schema } from "@/server/db";

/** "Delete my account": wipes the account's synced data before the Clerk user is deleted. */
export async function POST() {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "sign in first" }, { status: 401 });
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.delete(schema.syncRows).where(eq(schema.syncRows.userId, userId));
    await tx.delete(schema.ingredientReports).where(eq(schema.ingredientReports.userId, userId));
  });
  return NextResponse.json({ ok: true });
}
