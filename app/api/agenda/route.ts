import { NextResponse } from "next/server";
import { readPartidosFromSheet } from "@/app/lib/gsheet-partidos";

export const runtime = "nodejs";
// La persistencia de la agenda vive en Google Sheets (hoja "partidos")

export type Partido = {
  categoria: string;
  fecha: string;
  hora: string;
  equipo_local: string;
  equipo_visitante: string;
  resultado: string | null;
  pista: string;
  club1?: string;
  club2?: string;
};

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  return typeof err === "string" ? err : "Error";
}

export async function GET(request: Request) {
  try {
    const partidos = await readPartidosFromSheet();
    // Nota: no tenemos una fuente de "cachedAt" persistida en la hoja (todavía).
    // Devolvemos la hora de lectura para que la UI muestre una referencia.
    return NextResponse.json({ partidos, cachedAt: new Date().toISOString() });
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 500 });
  }
}