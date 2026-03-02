"use client";

import { abbreviateClub } from "../lib/abbreviateClub";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { parseFechaHora, type Partido } from "../lib/agenda";

// Countdown removed to avoid frequent timer updates and latency

function clubLogoSrc(clubId?: string) {
  if (!clubId) return null;
  // Logos disponibles actualmente en /public
  // (si añades más, amplía aquí o usa un patrón de nombres consistente)
  const map: Record<string, string> = {
    "232": "/232_1.webp",
    "253": "/253.webp",
    "251": "/251_1.webp",
    "246": "/246_1.webp",
    "288": "/288_1.webp",
    "289": "/289.webp",
    "612": "/612_1.webp",
  };
  return map[clubId] ?? null;
}


export function HeroNextMatch({ partido, clubId, categoriaFilter }: { partido?: Partido; clubId?: string; categoriaFilter?: string }) {
  const [current, setCurrent] = useState<Partido | undefined>(partido);

  useEffect(() => {
    const now = new Date();

    async function fetchNext() {
      try {
        const res = await fetch("/api/agenda");
        if (!res.ok) return;
        const data = await res.json();
        const partidos: Partido[] = data.partidos ?? [];
        const targetClub = clubId ?? partido?.club1 ?? partido?.club2;
        const catFilter = categoriaFilter ?? partido?.categoria ?? "";
        if (!targetClub) return;
        const futuros = partidos
          .filter((p) => (p.club1 === targetClub || p.club2 === targetClub) && p.categoria.includes(catFilter) && parseFechaHora(p.fecha, p.hora) > now)
          .sort((a, b) => parseFechaHora(a.fecha, a.hora).getTime() - parseFechaHora(b.fecha, b.hora).getTime());
        setCurrent(futuros[0]);
      } catch {
        // ignore
      }
    }

    if (!partido) {
      // no partido passed from server: try to fetch next
      fetchNext();
      return;
    }

    try {
      if (parseFechaHora(partido.fecha, partido.hora) <= now) {
        // passed: fetch fresh agenda and compute next
        fetchNext();
      } else {
        setCurrent(partido);
      }
    } catch {
      setCurrent(partido);
    }
  }, [partido, clubId, categoriaFilter]);

  return (
    <section className="mb-8 w-full">
      <div className="px-4 sm:px-8 py-4 sm:py-6 flex flex-col items-center text-center">
        {current ? (
          <div className="w-full max-w-4xl bg-gradient-to-r from-slate-800/70 via-slate-900/70 to-slate-800/50 rounded-2xl shadow-xl border border-white/6 p-6 sm:p-8 mb-4">
            <div className="grid grid-cols-3 items-start justify-center gap-4 sm:gap-6 mb-4">
              <div className="flex flex-col items-center justify-start gap-2 min-w-0 w-full">
                <div className="flex items-center justify-center">
                  {clubLogoSrc(current.club1) ? (
                    <Image
                      src={clubLogoSrc(current.club1)!}
                      alt={current.equipo_local}
                      width={96}
                      height={96}
                      className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 object-contain"
                      priority
                    />
                  ) : (
                    <span className="text-3xl font-black text-sky-400">{current.equipo_local.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <h3 className="text-base sm:text-xl md:text-2xl font-black tracking-tight leading-tight text-center break-words text-blue-200">
                  {abbreviateClub(current.equipo_local)}
                </h3>
              </div>

              <div className="flex flex-col items-center justify-center">
                <span className="text-sky-500/80 font-black italic text-5xl sm:text-6xl md:text-7xl">VS</span>
              </div>

              <div className="flex flex-col items-center justify-start gap-2 min-w-0 w-full">
                <div className="flex items-center justify-center">
                  {clubLogoSrc(current.club2) ? (
                    <Image
                      src={clubLogoSrc(current.club2)!}
                      alt={current.equipo_visitante}
                      width={96}
                      height={96}
                      className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 object-contain"
                      priority
                    />
                  ) : (
                    <span className="text-3xl font-black text-slate-400">{current.equipo_visitante.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <h3 className="text-base sm:text-xl md:text-2xl font-black tracking-tight leading-tight text-center break-words text-blue-200">
                  {abbreviateClub(current.equipo_visitante)}
                </h3>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center mb-4 py-4 sm:py-6">
              <div className="text-white text-xl sm:text-2xl md:text-3xl font-extrabold">
                {current ? `${current.fecha} · ${current.hora}` : ""}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-6 text-blue-200 px-4 sm:px-6 py-3 items-center">
              <div className="flex flex-col items-center sm:items-start">
                <span className="text-sm uppercase tracking-widest text-blue-300">Pista</span>
                <span className="mt-1 text-lg sm:text-2xl md:text-3xl font-extrabold text-white">{current.pista}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-slate-300 text-sm font-semibold">No hi ha pròxims partits.</div>
        )}
      </div>
    </section>
  );
}
