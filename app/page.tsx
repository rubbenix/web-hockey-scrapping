
import React from "react";

const CLUB_ID = "253"; // Cambia este valor para filtrar por club
const CATEGORIA = "BENJAMÍ OR COPA BCN 2"; // Cambia este valor para filtrar por categoría

type Partido = {
  categoria: string;
  fecha: string;
  hora: string;
  equipo_local: string;
  equipo_visitante: string;
  pista: string;
  club1: string;
  club2: string;
};

function parseFechaHora(fecha: string, hora: string) {
  // fecha: dd/mm/yyyy, hora: hh:mm
  const [d, m, y] = fecha.split("/").map(Number);
  const [h, min] = hora.split(":").map(Number);
  return new Date(y, m - 1, d, h, min);
}

async function getPartidos(): Promise<Partido[]> {
  const res = await fetch("/api/agenda", { cache: "no-store" });
  if (!res.ok) throw new Error("Error al cargar la agenda");
  const data = await res.json();
  return data.partidos as Partido[];
}

export default async function Home() {
  let partidos: Partido[] = [];
  let error = null;
  try {
    partidos = await getPartidos();
  } catch (e: any) {
    error = e.message || "Error desconocido";
  }

  const now = new Date();
  const filtered = partidos
    .filter(
      (p) =>
        (p.club1 === CLUB_ID || p.club2 === CLUB_ID) &&
        p.categoria === CATEGORIA &&
        parseFechaHora(p.fecha, p.hora) > now
    )
    .sort((a, b) =>
      parseFechaHora(a.fecha, a.hora).getTime() -
      parseFechaHora(b.fecha, b.hora).getTime()
    );

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col items-center py-8">
      <h1 className="text-2xl font-bold mb-6 text-zinc-800">Agenda Hockey Patines</h1>
      {error ? (
        <div className="text-red-600 bg-white p-4 rounded shadow mb-4">{error}</div>
      ) : partidos.length === 0 ? (
        <div className="text-zinc-500">Cargando partidos...</div>
      ) : filtered.length === 0 ? (
        <div className="text-zinc-500">No hay partidos próximos para el club y categoría seleccionados.</div>
      ) : (
        <div className="w-full max-w-2xl flex flex-col gap-4">
          {filtered.map((p, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow p-5 flex flex-col gap-2 border border-zinc-100"
            >
              <div className="text-xs text-zinc-500 mb-1">
                {p.fecha} {p.hora}
              </div>
              <div className="text-lg font-semibold text-zinc-800">
                {p.equipo_local} <span className="text-zinc-400">vs</span> {p.equipo_visitante}
              </div>
              <div className="text-sm text-zinc-600">Pista: {p.pista}</div>
            </div>
          ))}
        </div>
      )}
      <footer className="mt-10 text-xs text-zinc-400">Datos: FECAPA</footer>
    </div>
  );
}
