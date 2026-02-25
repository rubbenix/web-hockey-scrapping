import { google } from "googleapis";
import type { Partido } from "@/app/lib/agenda";

const SHEET_NAME = "partidos";

const FIELDS: Array<keyof Partido> = [
  "categoria",
  "fecha",
  "hora",
  "equipo_local",
  "equipo_visitante",
  "resultado",
  "pista",
  "club1",
  "club2",
];

function asTrimmedString(value: unknown) {
  if (value == null) return "";
  return String(value).trim();
}

function normalizeResultado(value: unknown): string | null {
  const s = asTrimmedString(value);
  if (!s) return null;
  if (s === "-" || s === "—") return null;
  return s;
}

function normalizePartido(raw: Record<string, unknown>): Partido | null {
  const categoria = asTrimmedString(raw.categoria);
  const fecha = asTrimmedString(raw.fecha);
  const hora = asTrimmedString(raw.hora);
  const equipo_local = asTrimmedString(raw.equipo_local);
  const equipo_visitante = asTrimmedString(raw.equipo_visitante);
  const pista = asTrimmedString(raw.pista);

  // filas vacías / incompletas
  if (!categoria || !fecha || !hora || !equipo_local || !equipo_visitante || !pista) return null;

  const resultado = normalizeResultado(raw.resultado);
  const club1 = asTrimmedString(raw.club1) || undefined;
  const club2 = asTrimmedString(raw.club2) || undefined;

  return {
    categoria,
    fecha,
    hora,
    equipo_local,
    equipo_visitante,
    resultado,
    pista,
    club1,
    club2,
  };
}

function getSheetsClient() {
  const client_email = process.env.GS_CLIENT_EMAIL;
  const private_key = process.env.GS_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const spreadsheetId = process.env.GS_SPREADSHEET_ID;

  const missing: string[] = [];
  if (!client_email) missing.push("GS_CLIENT_EMAIL");
  if (!private_key) missing.push("GS_PRIVATE_KEY");
  if (!spreadsheetId) missing.push("GS_SPREADSHEET_ID");
  if (missing.length > 0) {
    throw new Error(`Faltan credenciales de Google Sheets: ${missing.join(", ")}`);
  }

  const auth = new google.auth.JWT({
    email: client_email,
    key: private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  return { sheets, spreadsheetId };
}

export async function readPartidosFromSheet(): Promise<{ partidos: Partido[]; cachedAt?: string }> {
  const { sheets, spreadsheetId } = getSheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A1:Z`,
  });

  const values = res.data.values ?? [];
  if (values.length < 2) return { partidos: [] };

  const headers = values[0].map((h) => asTrimmedString(h));
  const rows = values.slice(1);

  const partidos: Partido[] = [];
  for (const row of rows) {
    const raw: Record<string, unknown> = {};
    for (let i = 0; i < headers.length; i++) {
      const h = headers[i];
      if (!h) continue;
      raw[h] = row[i] ?? "";
    }

    // limitar a campos esperados
    const picked: Record<string, unknown> = {};
    for (const f of FIELDS) picked[f] = raw[f] ?? "";

    const p = normalizePartido(picked);
    if (p) partidos.push(p);
  }

  // Intentar leer una marca de tiempo en la hoja `meta` (celda A1) con la última comprobación.
  let cachedAt: string | undefined;
  try {
    const metaRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: `meta!A1` });
    const metaVals = metaRes.data.values ?? [];
    if (metaVals.length && metaVals[0].length) {
      const v = asTrimmedString(metaVals[0][0]);
      if (v) cachedAt = v;
    }
  } catch {
    // no pasa nada si no existe la hoja `meta`
  }

  return { partidos, cachedAt };
}
