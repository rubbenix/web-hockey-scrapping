import React from "react";
import type { Partido } from "../lib/agenda";

export function HeroNextMatch({ partido }: { partido?: Partido }) {
  return (
    <section className="mb-10 w-full">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-blue-400 dark:from-blue-900 dark:via-blue-800 dark:to-slate-900 border border-blue-200 dark:border-blue-900 shadow-2xl">
        <div className="relative z-10 p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row items-center justify-between gap-5 sm:gap-8">
          {partido ? (
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3 sm:gap-8 flex-1 min-w-0">
              <div className="text-center min-w-0">
                <p className="text-white font-extrabold text-xl sm:text-2xl md:text-3xl drop-shadow-lg leading-tight break-words">
                  {partido.equipo_local}
                </p>
              </div>
              <div className="text-center">
                <span className="text-white font-black text-3xl sm:text-4xl md:text-5xl italic px-4 sm:px-6 drop-shadow-lg">
                  VS
                </span>
              </div>
              <div className="text-center min-w-0">
                <p className="text-white font-extrabold text-xl sm:text-2xl md:text-3xl drop-shadow-lg leading-tight break-words">
                  {partido.equipo_visitante}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 text-center text-white">
              No hay próximos partidos.
            </div>
          )}

          {partido && (
            <div className="flex-1 text-center lg:text-left mt-6 lg:mt-0">
              <span className="inline-flex items-center gap-1.5 py-1 px-4 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider mb-4 border border-white/30 shadow">
                Próximo partido
              </span>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-blue-100">
                <span className="text-sm font-medium">{partido.fecha}</span>
                <span className="text-sm font-medium">{partido.hora}</span>
                <span className="text-sm font-medium">{partido.pista}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
