import { NextResponse } from "next/server";
import { addSubscriber, removeSubscriber, verifyUnsubscribeToken } from "@/app/lib/subscriptions";

export const runtime = "nodejs";

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  return typeof err === "string" ? err : "Error";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email") ?? "";
  const token = url.searchParams.get("token") ?? "";
  if (!email || !token) {
    return NextResponse.json({ error: "Falta email o token" }, { status: 400 });
  }
  if (!verifyUnsubscribeToken(email, token)) {
    return NextResponse.json({ error: "Token inválido" }, { status: 403 });
  }
  const emails = await removeSubscriber(email);
  return NextResponse.json({ ok: true, count: emails.length });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string };
    if (!body.email) {
      return NextResponse.json({ error: "Falta email" }, { status: 400 });
    }
    const emails = await addSubscriber(body.email);
    return NextResponse.json({ ok: true, count: emails.length });
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; token?: string };
    if (!body.email || !body.token) {
      return NextResponse.json({ error: "Falta email o token" }, { status: 400 });
    }
    if (!verifyUnsubscribeToken(body.email, body.token)) {
      return NextResponse.json({ error: "Token inválido" }, { status: 403 });
    }
    const emails = await removeSubscriber(body.email);
    return NextResponse.json({ ok: true, count: emails.length });
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 });
  }
}
