import { and, asc, eq, gt, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { MAX_ROWS_PER_RESPONSE, parseSyncRequest, type SyncResponse } from "@/lib/sync/protocol";
import { currentUserId } from "@/server/auth";
import { getDb, schema } from "@/server/db";

const { syncRows, ingredientReports } = schema;

/**
 * Two-way sync for the signed-in account: upserts the device's changes (last
 * write wins by device timestamp; deletions carry `deleted`), then returns
 * every row changed since the device's cursor.
 */
export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "sign in to sync" }, { status: 401 });

  const parsed = parseSyncRequest(await request.json().catch(() => null));
  if (typeof parsed === "string") return NextResponse.json({ error: parsed }, { status: 400 });

  const db = getDb();
  await db.transaction(async (tx) => {
    if (parsed.changes.length) {
      await tx
        .insert(syncRows)
        .values(
          parsed.changes.map((c) => ({
            userId,
            entity: c.entity,
            key: c.key,
            data: c.data,
            deleted: c.data === null,
            updatedAt: c.updatedAt,
            version: sql`nextval('sync_version')`,
          })),
        )
        .onConflictDoUpdate({
          target: [syncRows.userId, syncRows.entity, syncRows.key],
          set: {
            data: sql`excluded.data`,
            deleted: sql`excluded.deleted`,
            updatedAt: sql`excluded.updated_at`,
            version: sql`nextval('sync_version')`,
          },
          // Only a newer edit replaces what's stored.
          setWhere: sql`excluded.updated_at > ${syncRows.updatedAt}`,
        });
    }
    if (parsed.reports?.length) {
      await tx.insert(ingredientReports).values(parsed.reports.map((report) => ({ userId, report })));
    }
  });

  const rows = await db
    .select()
    .from(syncRows)
    .where(and(eq(syncRows.userId, userId), gt(syncRows.version, parsed.since)))
    .orderBy(asc(syncRows.version))
    .limit(MAX_ROWS_PER_RESPONSE);

  const body: SyncResponse = {
    rows: rows.map((r) => ({
      entity: r.entity as SyncResponse["rows"][number]["entity"],
      key: r.key,
      data: r.data,
      deleted: r.deleted,
      updatedAt: r.updatedAt,
      version: r.version,
    })),
    cursor: rows.length ? rows[rows.length - 1].version : parsed.since,
    hasMore: rows.length === MAX_ROWS_PER_RESPONSE,
  };
  return NextResponse.json(body);
}
