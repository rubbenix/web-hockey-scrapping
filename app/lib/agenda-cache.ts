import type { Partido } from "./agenda";
import { readPartidosFromSheet } from "./gsheet-partidos";

let cached: { partidos: Partido[]; ts: number } | null = null;

export async function getCachedPartidos() {
  const ttl = Number(process.env.AGENDA_CACHE_TTL_SECONDS ?? 300);
  const now = Date.now();
  if (cached && now - cached.ts < ttl * 1000) {
    return { partidos: cached.partidos, cachedAt: new Date(cached.ts).toISOString() };
  }

  const result = await readPartidosFromSheet();
  const partidos = result.partidos ?? [];

  // Si la hoja contiene un cachedAt en 'meta!A1', respetarlo como la hora de la última comprobación.
  let ts = now;
  if (result.cachedAt) {
    const parsed = Date.parse(result.cachedAt);
    if (Number.isFinite(parsed)) ts = parsed;
  }

  cached = { partidos, ts };
  return { partidos, cachedAt: new Date(ts).toISOString() };
}

export function clearAgendaCache() {
  cached = null;
}

export function getAgendaCacheStatus() {
  return { hasCache: cached !== null, ts: cached?.ts };
}
