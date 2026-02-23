// Google Sheets utility for reading/writing matches (partidos)
// Uses the same credentials as subscriptions API
const { google } = require('googleapis');

const SHEET_NAME = 'partidos'; // Name of the sheet/tab for matches

async function getGoogleSheetsClient() {
  const client_email = process.env.GS_CLIENT_EMAIL;
  const private_key = process.env.GS_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const spreadsheetId = process.env.GS_SPREADSHEET_ID;
  if (!client_email || !private_key || !spreadsheetId) {
    throw new Error('Faltan credenciales de Google Sheets');
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
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] || ""; });
    return obj;
  });
}

async function writeMatchesToSheet(matches) {
  const { sheets, spreadsheetId } = await getGoogleSheetsClient();
  if (!Array.isArray(matches) || matches.length === 0) return;
  const headers = Object.keys(matches[0]);
  const values = [headers, ...matches.map(m => headers.map(h => m[h] || ""))];
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values },
  });
}

module.exports = { readMatchesFromSheet, writeMatchesToSheet };