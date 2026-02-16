import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const revalidate = 3600; // 1 hour

const FECAPA_URL = 'https://server2.sidgad.es/fecapa/00_fecapa_agenda_1.php';
const HEADERS = {
  'Origin': 'https://www.hoqueipatins.fecapa.cat',
  'Referer': 'https://www.hoqueipatins.fecapa.cat/',
  'User-Agent': 'Mozilla/5.0',
  'Content-Type': 'application/x-www-form-urlencoded',
};
const FORM_BODY = 'cliente=fecapa&idm=1&id_temp=31';

export async function GET() {
  try {
    const response = await fetch(FECAPA_URL, {
      method: 'POST',
      headers: HEADERS,
      body: FORM_BODY,
      cache: 'no-store',
    });
    if (!response.ok) {
      return NextResponse.json({ error: 'Error fetching agenda' }, { status: 500 });
    }
    const html = await response.text();
    const $ = cheerio.load(html);
    const partidos: any[] = [];
    $('.fila_agenda').each((_, el) => {
      const tds = $(el).find('td');
      partidos.push({
        categoria: $(tds[0]).text().trim(),
        fecha: $(tds[1]).text().trim(),
        hora: $(tds[2]).text().trim(),
        equipo_local: $(tds[3]).text().trim(),
        equipo_visitante: $(tds[4]).text().trim(),
        pista: $(tds[5]).text().trim(),
        club1: $(tds[6]).text().trim(),
        club2: $(tds[7]).text().trim(),
      });
    });
    return NextResponse.json({ partidos });
  } catch (error) {
    return NextResponse.json({ error: 'Server error', details: String(error) }, { status: 500 });
  }
}
