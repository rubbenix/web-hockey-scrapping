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
    <section className="relative rounded-xl overflow-hidden mb-8 bg-black border border-sky-500/20 shadow-2xl w-full">
      <div className="relative z-10 p-6 flex flex-col items-center text-center">

        {partido ? (
          <>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 mb-6">
              <div className="flex flex-col items-center gap-4 min-w-0">
                <div className="size-24 bg-slate-900 rounded-2xl flex items-center justify-center border border-white/5 p-4 shadow-inner">
                  {clubLogoSrc(partido.club1) ? (
                    <Image
                      src={clubLogoSrc(partido.club1)!}
                      alt={partido.equipo_local}
                      width={96}
                      height={96}
                      className="h-16 w-16 object-contain"
                      priority
                    />
                  ) : (
                    <span className="text-3xl font-black text-sky-400">
                      {partido.equipo_local.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-black tracking-tight text-white break-words">
                  {partido.equipo_local}
                </h3>
              </div>

              <div className="flex flex-col items-center">
                <div className="text-sky-500/40 font-black italic text-xl mb-4">VS</div>
                <div className="flex gap-2">
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 bg-slate-900 border border-sky-500/20 rounded-xl flex items-center justify-center text-xl font-black text-sky-400">
                      {countdown ? pad2(countdown.days) : "--"}
                    </div>
                    <span className="text-[9px] uppercase tracking-widest mt-2 text-slate-500 font-bold">Days</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 bg-slate-900 border border-sky-500/20 rounded-xl flex items-center justify-center text-xl font-black text-sky-400">
                      {countdown ? pad2(countdown.hours) : "--"}
                    </div>
                    <span className="text-[9px] uppercase tracking-widest mt-2 text-slate-500 font-bold">Hours</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 bg-slate-900 border border-sky-500/20 rounded-xl flex items-center justify-center text-xl font-black text-sky-400">
                      {countdown ? pad2(countdown.mins) : "--"}
                    </div>
                    <span className="text-[9px] uppercase tracking-widest mt-2 text-slate-500 font-bold">Mins</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 min-w-0">
                <div className="size-24 bg-slate-900 rounded-2xl flex items-center justify-center border border-white/5 p-4 shadow-inner">
                  {clubLogoSrc(partido.club2) ? (
                    <Image
                      src={clubLogoSrc(partido.club2)!}
                      alt={partido.equipo_visitante}
                      width={96}
                      height={96}
                      className="h-16 w-16 object-contain"
                      priority
                    />
                  ) : (
                    <span className="text-3xl font-black text-slate-400">
                      {partido.equipo_visitante.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-black tracking-tight text-white break-words">
                  {partido.equipo_visitante}
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-slate-300 bg-slate-900/40 px-6 py-2.5 rounded-xl border border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-sky-400 text-xs font-black">LLOC</span>
                <span className="text-xs font-bold break-words">{partido.pista}</span>
              </div>
              <div className="flex items-center gap-2 md:border-l md:border-white/10 md:pl-6">
                <span className="text-sky-400 text-xs font-black">DATA</span>
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
