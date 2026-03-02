import { NextResponse } from "next/server";
import { getAgendaCacheStatus } from "@/app/lib/agenda-cache";

export const runtime = "nodejs";

export async function GET() {
  try {
    const status = getAgendaCacheStatus();
    return NextResponse.json({ ok: true, status });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
