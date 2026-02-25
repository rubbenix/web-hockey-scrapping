// Google Sheets utility for reading/writing matches (partidos)
// Uses the same credentials as subscriptions API
const { google } = require('googleapis');

const SHEET_NAME = 'partidos'; // Name of the sheet/tab for matches

const MATCH_FIELDS = [
  'categoria',
  'fecha',
  'hora',
  'equipo_local',
  'equipo_visitante',
  'resultado',
  'pista',
  'club1',
  'club2',
];

function asTrimmedString(value) {
  if (value == null) return '';
  return String(value).trim();
}

function normalizeResultado(value) {
  const s = asTrimmedString(value);
  if (!s) return null;
  if (s === '-' || s === '—') return null;
  return s;
}

function normalizeMatchFromSheetRow(raw) {
  const match = {
    categoria: asTrimmedString(raw.categoria),
    fecha: asTrimmedString(raw.fecha),
    hora: asTrimmedString(raw.hora),
    equipo_local: asTrimmedString(raw.equipo_local),
    equipo_visitante: asTrimmedString(raw.equipo_visitante),
    resultado: normalizeResultado(raw.resultado),
    pista: asTrimmedString(raw.pista),
    club1: asTrimmedString(raw.club1),
    club2: asTrimmedString(raw.club2),
  };

  const hasAny = Object.entries(match).some(([k, v]) => (k === 'resultado' ? v != null : Boolean(v)));
  return hasAny ? match : null;
}

async function getGoogleSheetsClient() {
  const client_email = process.env.GS_CLIENT_EMAIL;
  const private_key = process.env.GS_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const spreadsheetId = process.env.GS_SPREADSHEET_ID;
  const missing = [];
  if (!client_email) missing.push('GS_CLIENT_EMAIL');
  if (!private_key) missing.push('GS_PRIVATE_KEY');
  if (!spreadsheetId) missing.push('GS_SPREADSHEET_ID');
  if (missing.length > 0) {
    throw new Error(`Faltan credenciales de Google Sheets: ${missing.join(', ')}`);
  }
  const auth = new google.auth.JWT({
    email: client_email,
    key: private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  return { sheets, spreadsheetId };
}

async function readMatchesFromSheet() {
  const { sheets, spreadsheetId } = await getGoogleSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A1:H`,
  });
  const rows = res.data.values || [];
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => asTrimmedString(h));
  return rows
    .slice(1)
    .map((row) => {
      const raw = {};
      headers.forEach((h, i) => {
        if (!h) return;
        raw[h] = row[i] ?? '';
      });
      // Only keep the fields we actually compare
      const picked = {};
      for (const f of MATCH_FIELDS) picked[f] = raw[f] ?? '';
      return normalizeMatchFromSheetRow(picked);
    })
    .filter(Boolean);
}

async function writeMatchesToSheet(matches) {
  const { sheets, spreadsheetId } = await getGoogleSheetsClient();
  if (!Array.isArray(matches) || matches.length === 0) return;
  const headers = MATCH_FIELDS;
  const values = [
    headers,
    ...matches.map((m) =>
      headers.map((h) => {
        const v = m[h];
        if (h === 'resultado') return v == null ? '' : String(v);
        return v ?? '';
      })
    ),
  ];
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values },
  });
}

module.exports = { readMatchesFromSheet, writeMatchesToSheet };

async function writeMetaTimestamp(timestampIso) {
  const { sheets, spreadsheetId } = await getGoogleSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `meta!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [[timestampIso]] },
  });
}

module.exports = { readMatchesFromSheet, writeMatchesToSheet, writeMetaTimestamp };