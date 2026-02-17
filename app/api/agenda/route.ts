import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
// El revalidate ya no es necesario, controlamos el refresco manualmente

const FECAPA_URL = "https://server2.sidgad.es/fecapa/00_fecapa_agenda_1.php";
const DATA_PATH = path.join(process.cwd(), "app", "data", "agenda.json");

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

export async function GET(request: Request) {
  // Permitir recarga manual con ?refresh=1
  const url = new URL(request.url);
  const forceRefresh = url.searchParams.get("refresh") === "1";
  // Horas permitidas: 12:00, 20:00, 00:00
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const allowed = ([12, 20, 0].includes(hours) && minutes === 0);

  // Leer caché si existe
  let cache: any = null;
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    cache = JSON.parse(raw);
  } catch {}

  // Si no es hora permitida y no es refresh manual, devolver caché si existe
  if (!forceRefresh && !allowed && cache) {
    return NextResponse.json({ partidos: cache.partidos, cachedAt: cache.cachedAt });
  }

  // Intentar obtener datos frescos
  try {
    const response = await fetch(FECAPA_URL, {
      method: "POST",
      headers: {
        Origin: "https://www.hoqueipatins.fecapa.cat",
        Referer: "https://www.hoqueipatins.fecapa.cat/",
        "User-Agent": "Mozilla/5.0",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "cliente=fecapa&idm=1&id_temp=31",
      cache: "no-store",
    });
    if (!response.ok) throw new Error("No se pudo obtener la agenda");
    const html = await response.text();
    const $ = cheerio.load(html);
    const partidos: Partido[] = [];
    $(".fila_agenda").each((_, el) => {
      const tds = $(el).find("td");
      if (tds.length < 6) return;
      const categoria = $(tds[0]).text().trim();
      const fecha = $(tds[1]).text().trim();
      const hora = $(tds[2]).text().trim();
      const equipo_local = $(tds[4] ?? tds[3]).text().trim();
      const equipo_visitante = $(tds[6] ?? tds[4]).text().trim();
      const pista = $(tds[tds.length - 1]).text().trim();
      const resultadoRaw = $(tds[7] ?? "").text?.() ?? "";
      const resultado = typeof resultadoRaw === "string" && resultadoRaw.includes("-")
        ? resultadoRaw.trim()
        : null;
      partidos.push({
        categoria,
        fecha,
        hora,
        equipo_local,
        equipo_visitante,
        resultado,
        pista,
        club1: $(el).attr("club1") || undefined,
        club2: $(el).attr("club2") || undefined,
      });
    });
    // Guardar en caché
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, JSON.stringify({ partidos, cachedAt: new Date().toISOString() }), "utf-8");
    return NextResponse.json({ partidos, cachedAt: new Date().toISOString() });
  } catch (e: any) {
    // Si hay error y hay caché, devolver caché
    if (cache) {
      return NextResponse.json({ partidos: cache.partidos, cachedAt: cache.cachedAt, error: e.message });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
