

const CLUB_ID = "253";
const CATEGORIA = "BENJAMÍ OR COPA BCN 2";

import { HeroNextMatch } from "./components/HeroNextMatch";
import { MatchCard } from "./components/MatchCard";
import { Section } from "./components/Section";
import { SubscriptionBell } from "./components/SubscriptionBell";
import { parseFechaHora, type Partido } from "./lib/agenda";
import { getBaseUrl } from "./lib/base-url";

async function getPartidos(): Promise<{ partidos: Partido[]; cachedAt?: string }> {
  const baseUrl = await getBaseUrl();
  const res = await fetch(`${baseUrl}/api/agenda`);
  if (!res.ok) throw new Error("No se pudo cargar la agenda");
  const data = (await res.json()) as { partidos?: Partido[]; cachedAt?: string };
  return { partidos: data.partidos ?? [], cachedAt: data.cachedAt };
}

export default async function Home() {
  const { partidos, cachedAt } = await getPartidos();
  const now = new Date();
  const filtrados = partidos.filter(
    (p) =>
      (p.club1 === CLUB_ID || p.club2 === CLUB_ID) &&
      p.categoria.includes(CATEGORIA)
  );
  const futuros = filtrados
    .filter((p) => parseFechaHora(p.fecha, p.hora) > now)
    .sort((a, b) => parseFechaHora(a.fecha, a.hora).getTime() - parseFechaHora(b.fecha, b.hora).getTime());
  const jugados = filtrados
    .filter((p) => parseFechaHora(p.fecha, p.hora) <= now)
    .sort((a, b) => parseFechaHora(b.fecha, b.hora).getTime() - parseFechaHora(a.fecha, a.hora).getTime());

  const proximo = futuros[0];
  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-3 sm:px-4 py-6 sm:py-8 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <div className="flex flex-row items-center justify-between gap-2 mb-4">
          <span className="text-xs text-blue-200">
            Última actualització: {cachedAt ? new Date(cachedAt).toLocaleString() : "-"}
          </span>
          <SubscriptionBell />
        </div>
        <HeroNextMatch partido={proximo} />

        <Section title="Pròxims partits">
          <div className="space-y-4">
            {futuros.length === 0 ? (
              <div className="text-blue-400">No hi ha pròxims partits.</div>
            ) : (
              futuros.map((p, i) => <MatchCard key={`${p.fecha}-${p.hora}-${i}`} partido={p} />)
            )}
          </div>
        </Section>

        <Section title="Partits jugats">
          <div className="space-y-4">
            {jugados.length === 0 ? (
              <div className="text-blue-200">No hi ha partits jugats.</div>
            ) : (
              jugados.map((p, i) => <MatchCard key={`${p.fecha}-${p.hora}-${i}`} partido={p} />)
            )}
          </div>
        </Section>
      </div>
    </main>
  );
}
