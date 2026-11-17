import { NextResponse } from "next/server";
import { cleanBatch } from "@/lib/events/protocol";
import { currentUserId } from "@/server/auth";
import { getDb, schema } from "@/server/db";

/** Only the live site records, so local runs and previews don't mix into the test data. */
const RECORDING = process.env.VERCEL_ENV === "production" || process.env.EVENTS_RECORD === "1";
const MAX_BODY = 64_000;

/** Usage events from a device's queue (tester week). Ids are made on the device, so a retry never counts twice. */
export async function POST(request: Request) {
  const text = await request.text();
  if (text.length > MAX_BODY) return NextResponse.json({ error: "too large" }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const batch = cleanBatch(body, Date.now());
  if (!batch) return NextResponse.json({ error: "invalid batch" }, { status: 400 });
  if (!RECORDING || !batch.events.length) return new NextResponse(null, { status: 204 });

  const userId = await currentUserId();
  await getDb()
    .insert(schema.appEvents)
    .values(
      batch.events.map((e) => ({
        id: e.id,
        userId,
        guestId: batch.guestId,
        testerCode: e.tester,
        name: e.name,
        props: e.props,
        occurredAt: new Date(e.at),
      })),
    )
    .onConflictDoNothing();
  return new NextResponse(null, { status: 204 });
}
