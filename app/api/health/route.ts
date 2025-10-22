import { NextResponse } from "next/server";

// Avoid caching and keep it simple — used by the client to verify connectivity.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { ok: true, timestamp: Date.now() },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
