import * as cheerio from "cheerio";

export const runtime = "nodejs";
export const revalidate = 3600;

const FECAPA_URL =
  "https://server2.sidgad.es/fecapa/00_fecapa_agenda_1.php";

const CLUB_ID = "253";
const CATEGORIA = "BENJAMÍ OR COPA BCN 2";

type Partido = {
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

function parseFechaHora(fecha: string, hora: string) {
  const [d, m, y] = fecha.split("/").map(Number);
  const [h, min] = hora.split(":").map(Number);
  return new Date(y, m - 1, d, h, min);
}

async function getPartidos(): Promise<Partido[]> {
  const response = await fetch(FECAPA_URL, {
    method: "POST",
    headers: {
      Origin: "https://www.hoqueipatins.fecapa.cat",
      Referer: "https://www.hoqueipatins.fecapa.cat/",
      "User-Agent": "Mozilla/5.0",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "cliente=fecapa&idm=1&id_temp=31",
  });

  const html = await response.text();
  const $ = cheerio.load(html);

  const partidos: Partido[] = [];

  $(".fila_agenda").each((_, el) => {
    const tds = $(el).find("td");
    if (tds.length < 9) return;

    const resultadoRaw = $(tds[7]).text().trim();
    const tieneResultado = resultadoRaw.includes("-");

    partidos.push({
      categoria: $(tds[0]).text().trim(),
      fecha: $(tds[1]).text().trim(),
      hora: $(tds[2]).text().trim(),
      equipo_local: $(tds[4]).text().trim(),
      equipo_visitante: $(tds[6]).text().trim(),
      resultado: tieneResultado ? resultadoRaw : null,
      pista: $(tds[8]).text().trim(),
      club1: $(el).attr("club1") || undefined,
      club2: $(el).attr("club2") || undefined,
    });
  });

  return partidos;
}

export default async function Home() {
  const partidos = await getPartidos();
  const now = new Date();

  const filtrados = partidos.filter(
    (p) =>
      (p.club1 === CLUB_ID || p.club2 === CLUB_ID) &&
      p.categoria.includes(CATEGORIA)
  );

  const proximos = filtrados
    .filter((p) => parseFechaHora(p.fecha, p.hora) > now)
    .sort(
      (a, b) =>
        parseFechaHora(a.fecha, a.hora).getTime() -
        parseFechaHora(b.fecha, b.hora).getTime()
    );

  const jugados = filtrados
    .filter((p) => parseFechaHora(p.fecha, p.hora) <= now)
    .sort(
      (a, b) =>
        parseFechaHora(b.fecha, b.hora).getTime() -
        parseFechaHora(a.fecha, a.hora).getTime()
    );

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col items-center py-10 px-4">
      <h1 className="text-3xl font-bold mb-10 text-zinc-800 text-center">
        Agenda & Resultados
      </h1>

      <section className="w-full max-w-2xl mb-12">
        <h2 className="text-xl font-semibold mb-4 text-zinc-700">
          Próximos partidos
        </h2>

        {proximos.length === 0 ? (
          <div className="text-zinc-500">No hay próximos partidos.</div>
        ) : (
          proximos.map((p, i) => <Card key={i} partido={p} />)
        )}
      </section>

      <section className="w-full max-w-2xl">
        <h2 className="text-xl font-semibold mb-4 text-zinc-700">
          Partidos jugados
        </h2>

        {jugados.length === 0 ? (
          <div className="text-zinc-500">No hay partidos jugados.</div>
        ) : (
          jugados.map((p, i) => <Card key={i} partido={p} />)
        )}
      </section>
    </div>
  );
}

function Card({ partido }: { partido: Partido }) {
  return (
    <div className="bg-white rounded-xl shadow p-5 border border-zinc-100 mb-4">
      <div className="text-xs text-zinc-500 mb-1">
        {partido.fecha} {partido.hora}
      </div>

      <div className="text-lg font-semibold text-zinc-800 flex justify-between">
        <span>{partido.equipo_local}</span>

        {partido.resultado ? (
          <span className="font-bold">{partido.resultado}</span>
        ) : (
          <span className="text-zinc-400">vs</span>
        )}

        <span>{partido.equipo_visitante}</span>
      </div>

      <div className="text-sm text-zinc-600 mt-1">
        {partido.pista}
      </div>
    </div>
  );
}
