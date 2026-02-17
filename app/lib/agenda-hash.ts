import crypto from "crypto";
import type { Partido } from "@/app/lib/agenda";

function normalizeText(s: string | null | undefined) {
  return (s ?? "").toString().trim().replace(/\s+/g, " ");
}

export function partidoKey(p: Partido) {
  return [
    normalizeText(p.categoria),
    normalizeText(p.fecha),
    normalizeText(p.hora),
    normalizeText(p.equipo_local),
    normalizeText(p.equipo_visitante),
  ].join("|");
}

function partidoStableKey(p: Partido) {
  return [
    normalizeText(p.categoria),
    normalizeText(p.equipo_local),
    normalizeText(p.equipo_visitante),
  ].join("|");
}

function hasRelevantChanges(a: Partido, b: Partido) {
  return (
    normalizeText(a.fecha) !== normalizeText(b.fecha) ||
    normalizeText(a.hora) !== normalizeText(b.hora) ||
    normalizeText(a.pista) !== normalizeText(b.pista) ||
    normalizeText(a.resultado) !== normalizeText(b.resultado)
  );
}

function scoreSimilarity(a: Partido, b: Partido) {
  let score = 0;
  if (normalizeText(a.fecha) === normalizeText(b.fecha)) score += 4;
  if (normalizeText(a.hora) === normalizeText(b.hora)) score += 4;
  if (normalizeText(a.pista) === normalizeText(b.pista)) score += 1;
  if (normalizeText(a.resultado) === normalizeText(b.resultado)) score += 1;
  return score;
}

export function computeAgendaHash(partidos: Partido[]) {
  const normalized = partidos
    .map((p) => ({
      categoria: normalizeText(p.categoria),
      fecha: normalizeText(p.fecha),
      hora: normalizeText(p.hora),
      equipo_local: normalizeText(p.equipo_local),
      equipo_visitante: normalizeText(p.equipo_visitante),
      resultado: normalizeText(p.resultado),
      pista: normalizeText(p.pista),
      club1: normalizeText(p.club1),
      club2: normalizeText(p.club2),
    }))
    .sort((a, b) => {
      const ak = `${a.fecha}|${a.hora}|${a.equipo_local}|${a.equipo_visitante}|${a.categoria}`;
      const bk = `${b.fecha}|${b.hora}|${b.equipo_local}|${b.equipo_visitante}|${b.categoria}`;
      return ak.localeCompare(bk);
    });

  const payload = JSON.stringify(normalized);
  return crypto.createHash("sha256").update(payload).digest("hex");
}

export function diffAgenda(before: Partido[], after: Partido[]) {
  // Nota: no podemos usar fecha/hora en la clave si queremos detectar
  // "modificats" cuando solo cambia la fecha u hora.
  const beforeByStable = new Map<string, Partido[]>();
  const afterByStable = new Map<string, Partido[]>();

  for (const p of before) {
    const k = partidoStableKey(p);
    const list = beforeByStable.get(k) ?? [];
    list.push(p);
    beforeByStable.set(k, list);
  }
  for (const p of after) {
    const k = partidoStableKey(p);
    const list = afterByStable.get(k) ?? [];
    list.push(p);
    afterByStable.set(k, list);
  }

  const added: Partido[] = [];
  const removed: Partido[] = [];
  const changed: Array<{ before: Partido; after: Partido }> = [];

  const allStableKeys = new Set<string>([
    ...beforeByStable.keys(),
    ...afterByStable.keys(),
  ]);

  for (const stableKey of allStableKeys) {
    const bList = (beforeByStable.get(stableKey) ?? []).slice();
    const aList = (afterByStable.get(stableKey) ?? []).slice();

    if (bList.length === 0) {
      added.push(...aList);
      continue;
    }
    if (aList.length === 0) {
      removed.push(...bList);
      continue;
    }

    // Emparejado greedy dentro del mismo (categoria+local+visitante)
    // para diferenciar modificats vs afegits/eliminats.
    const bUsed = new Array(bList.length).fill(false);

    for (const aItem of aList) {
      let bestIdx = -1;
      let bestScore = -1;

      for (let i = 0; i < bList.length; i++) {
        if (bUsed[i]) continue;
        const score = scoreSimilarity(bList[i], aItem);
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }

      // Si hay ambigüedad (varios partidos iguales) y no hay ninguna
      // coincidencia razonable, evitamos emparejar a ciegas.
      const canPairWithZeroScore = bList.length === 1 && aList.length === 1;
      if (bestIdx === -1 || (bestScore === 0 && !canPairWithZeroScore)) {
        added.push(aItem);
        continue;
      }

      const bItem = bList[bestIdx];
      bUsed[bestIdx] = true;

      if (hasRelevantChanges(bItem, aItem)) {
        changed.push({ before: bItem, after: aItem });
      }
    }

    for (let i = 0; i < bList.length; i++) {
      if (!bUsed[i]) removed.push(bList[i]);
    }
  }

  return { added, removed, changed };
}
