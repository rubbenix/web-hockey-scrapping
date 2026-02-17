import { NextResponse } from "next/server";
import { removeSubscriber, verifyUnsubscribeToken } from "@/app/lib/subscriptions";
import { google } from 'googleapis';

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
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ ok: false, error: 'Email requerido' }, { status: 400 });
    }

    // Carga credenciales desde variables de entorno
    const client_email = process.env.GS_CLIENT_EMAIL;
    const private_key = process.env.GS_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const spreadsheetId = process.env.GS_SPREADSHEET_ID;
    if (!client_email || !private_key || !spreadsheetId) {
      return NextResponse.json({ ok: false, error: 'Faltan credenciales de Google Sheets' }, { status: 500 });
    }

    const auth = new google.auth.JWT({
      email: client_email,
      key: private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    // Añade el email a la hoja (Sheet1, columna A)
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:A',
      valueInputOption: 'RAW',
      requestBody: { values: [[email, new Date().toISOString()]] },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: getErrorMessage(e) }, { status: 500 });
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
