import { NextResponse } from "next/server";
import { clearAgendaCache } from "@/app/lib/agenda-cache";

export const runtime = "nodejs";

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  return typeof err === "string" ? err : "Error";
}

export async function POST(request: Request) {
  const tokenHeader = request.headers.get("x-invalidate-token");
  const url = new URL(request.url);
  const tokenQuery = url.searchParams.get("token");
  const token = tokenHeader ?? tokenQuery;

  const secret = process.env.AGENDA_INVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Server misconfiguration: no secret" }, { status: 500 });
  }

  if (!token || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    clearAgendaCache();
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 500 });
  }
}
