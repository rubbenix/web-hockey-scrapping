import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { promises as fs } from "fs";
import path from "path";
import { computeAgendaHash } from "@/app/lib/agenda-hash";
import { notifyAgendaChanged } from "@/app/lib/notify";

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

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  return typeof err === "string" ? err : "Error";
}

export async function GET(request: Request) {
  // Permitir recarga manual con ?refresh=1
  const url = new URL(request.url);
  const forceRefresh = url.searchParams.get("refresh") === "1";
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  // Solo permitir actualización a las 18:00
  const allowed = (hours === 18 && minutes === 0);

  // Leer caché si existe
  let cache: unknown = null;
  try {
    const raw = await fs.readFile(path.join(path.dirname(DATA_PATH), "ben.json"), "utf-8");
    cache = JSON.parse(raw);
  } catch {}

  const cachedObj = (cache && typeof cache === "object") ? (cache as Record<string, unknown>) : null;

  // Si no es hora permitida y no es refresh manual, devolver caché si existe
  if (!forceRefresh && !allowed && cachedObj) {
    return NextResponse.json({ partidos: cachedObj.partidos, cachedAt: cachedObj.cachedAt });
  }

  // Intentar obtener datos frescos
  try {
    const BEN_PATH = path.join(path.dirname(DATA_PATH), "ben.json");
    // Leer el antiguo ben.json
    let oldData: { partidos: Partido[]; cachedAt?: string } = { partidos: [] };
    try {
      const oldRaw = await fs.readFile(BEN_PATH, "utf-8");
      oldData = JSON.parse(oldRaw);
    } catch {}

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
      const club1 = $(el).attr("club1") || undefined;
      const club2 = $(el).attr("club2") || undefined;
      if (
        (club1 === "253" || club2 === "253") &&
        (equipo_local === "JESUS MARIA I JOSEP B" || equipo_visitante === "JESUS MARIA I JOSEP B") &&
        categoria === "BCN BENJAMÍ OR COPA BCN 2"
      ) {
        partidos.push({
          categoria,
          fecha,
          hora,
          equipo_local,
          equipo_visitante,
          resultado,
          pista,
          club1,
          club2,
        });
      }
    });

    const nextCachedAt = new Date().toISOString();

    // Comparar con el antiguo y notificar si hay cambios
    const partidosChanged = JSON.stringify(oldData.partidos) !== JSON.stringify(partidos);
    if (partidosChanged) {
      try {
        const baseUrl = `${new URL(request.url).protocol}//${new URL(request.url).host}`;
        await notifyAgendaChanged({
          baseUrl,
          before: oldData.partidos,
          after: partidos,
          cachedAt: nextCachedAt,
        });
      } catch (e) {
        // Si falla el email, no romper la API
        console.error("Error enviando notificación de agenda:", e);
      }
    }

    // Guardar el nuevo ben.json
    await fs.writeFile(
      BEN_PATH,
      JSON.stringify({ partidos, cachedAt: nextCachedAt }, null, 2),
      "utf-8"
    );

    return NextResponse.json({ partidos, cachedAt: nextCachedAt });
  } catch (e: unknown) {
    // Si hay error y hay caché, devolver caché
    if (cache) {
      return NextResponse.json({ partidos: cachedObj?.partidos, cachedAt: cachedObj?.cachedAt, error: getErrorMessage(e) });
    }
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 500 });
  }
}