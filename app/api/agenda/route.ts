import { NextResponse } from "next/server";
import { getCachedPartidos } from "@/app/lib/agenda-cache";

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
    const { partidos, cachedAt } = await getCachedPartidos();
    // Devolvemos la hora de lectura o la de la cache para que la UI muestre una referencia.
    return NextResponse.json({ partidos, cachedAt });
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 500 });
  }
}