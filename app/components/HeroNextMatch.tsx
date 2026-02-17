import { abbreviateClub } from "../lib/abbreviateClub";
import React from "react";
import Image from "next/image";
import { parseFechaHora, type Partido } from "../lib/agenda";

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function getCountdown(partido: Partido) {
  const target = parseFechaHora(partido.fecha, partido.hora).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, target - now);
  const totalMins = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMins / (60 * 24));
  const hours = Math.floor((totalMins % (60 * 24)) / 60);
  const mins = totalMins % 60;
  return { days, hours, mins };
}

function clubLogoSrc(clubId?: string) {
  if (!clubId) return null;
  // Logos disponibles actualmente en /public
  // (si añades más, amplía aquí o usa un patrón de nombres consistente)
  const map: Record<string, string> = {
    "253": "/253.webp",
    "246": "/246_1.webp",
    "288": "/288_1.webp",
    "612": "/612_1.webp",
  };
  return map[clubId] ?? null;
}


export function HeroNextMatch({ partido }: { partido?: Partido }) {
  const countdown = partido ? getCountdown(partido) : null;

  return (
    <section className="mb-8 w-full">
      <div className="px-6 sm:px-12 py-4 sm:py-8 flex flex-col items-center text-center">

        {partido ? (
          <>

            <div className="grid grid-cols-3 items-start justify-center mb-2 sm:mb-4">
              <div className="flex flex-col items-center justify-start gap-2 min-w-0 w-full">
                <div className="flex items-center justify-center">
                  {clubLogoSrc(partido.club1) ? (
                    <Image
                      src={clubLogoSrc(partido.club1)!}
                      alt={partido.equipo_local}
                      width={96}
                      height={96}
                      className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 object-contain"
                      priority
                    />
                  ) : (
                    <span className="text-3xl font-black text-sky-400">
                      {partido.equipo_local.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-xl md:text-2xl font-black tracking-tight leading-tight text-center break-words">
                  {abbreviateClub(partido.equipo_local)}
                </h3>
              </div>

              <div className="flex flex-col items-center justify-center">
                <span className="text-sky-500/40 font-black italic text-lg sm:text-xl">VS</span>
              </div>

              <div className="flex flex-col items-center justify-start gap-2 min-w-0 w-full">
                <div className="flex items-center justify-center">
                  {clubLogoSrc(partido.club2) ? (
                    <Image
                      src={clubLogoSrc(partido.club2)!}
                      alt={partido.equipo_visitante}
                      width={96}
                      height={96}
                      className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 object-contain"
                      priority
                    />
                  ) : (
                    <span className="text-3xl font-black text-slate-400">
                      {partido.equipo_visitante.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-xl md:text-2xl font-black tracking-tight leading-tight text-center break-words">
                  {abbreviateClub(partido.equipo_visitante)}
                </h3>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center mb-2 sm:mb-4 py-6 sm:py-10">
              <div className="flex flex-row items-center justify-center gap-2 sm:gap-3">
                <span className="text-3xl sm:text-4xl md:text-5xl font-mono font-black text-sky-400 tabular-nums">
                  {countdown ? pad2(countdown.days) : "--"}
                </span>
                <span className="text-2xl sm:text-3xl md:text-4xl font-mono font-black text-sky-400">:</span>
                <span className="text-3xl sm:text-4xl md:text-5xl font-mono font-black text-sky-400 tabular-nums">
                  {countdown ? pad2(countdown.hours) : "--"}
                </span>
                <span className="text-2xl sm:text-3xl md:text-4xl font-mono font-black text-sky-400">:</span>
                <span className="text-3xl sm:text-4xl md:text-5xl font-mono font-black text-sky-400 tabular-nums">
                  {countdown ? pad2(countdown.mins) : "--"}
                </span>
              </div>
              <div className="flex flex-row items-center justify-center gap-4 sm:gap-6 mt-1">
                <span className="text-xs sm:text-sm uppercase tracking-widest text-slate-500 font-bold px-1 sm:px-2">DIES</span>
                <span className="text-xs sm:text-sm uppercase tracking-widest text-slate-500 font-bold px-1 sm:px-2">HORES</span>
                <span className="text-xs sm:text-sm uppercase tracking-widest text-slate-500 font-bold px-1 sm:px-2">MIN.</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-6 text-slate-300 px-4 sm:px-6 py-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold break-words">{partido.pista}</span>
              </div>
              <div className="flex items-center gap-2 sm:border-l sm:border-white/10 sm:pl-6">
                <span className="text-xs font-bold">
                  {partido.fecha} | {partido.hora}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-slate-300 text-sm font-semibold">
            No hay próximos partidos.
          </div>
        )}
      </div>
    </section>
  );
}
