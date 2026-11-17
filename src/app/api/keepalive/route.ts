import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/server/db";

// Supabase pauses a free project after a week without activity. A Vercel cron
// (vercel.json, once a day) calls this so the database stays awake.

export async function GET(request: Request) {
  // Vercel sends CRON_SECRET as a bearer token when it's set; without it the route stays harmless.
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  // A real table read (not just "select 1"), cheap: one index lookup.
  await getDb().execute(sql`select 1 from sync_rows limit 1`);
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
