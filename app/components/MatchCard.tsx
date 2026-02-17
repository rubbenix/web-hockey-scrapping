import { abbreviateClub } from "../lib/abbreviateClub";
import React from "react";
import type { Partido } from "../lib/agenda";

export function MatchCard({ partido }: { partido: Partido }) {
  const [home, away] = partido.resultado ? partido.resultado.split("-") : ["-", "-"];
  const hasResultado = Boolean(partido.resultado);

  return (
    <div className="bg-white/90 dark:bg-slate-800/80 p-5 rounded-2xl border border-blue-200 dark:border-blue-900 shadow-lg flex flex-col gap-2">
      <div className="mb-1 text-xs font-bold text-blue-700 dark:text-blue-200 uppercase tracking-wide">
        <div className="text-blue-600/90 dark:text-blue-200/90">
          {partido.fecha} {partido.hora}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 sm:gap-3">

        <span className="font-bold text-sm sm:text-base text-blue-900 dark:text-blue-100 min-w-0 truncate text-left">
          {abbreviateClub(partido.equipo_local)}
        </span>

        <span className="justify-self-center text-center w-14 sm:w-20">
          {hasResultado ? (
            <span className="inline-flex items-center justify-center gap-1 sm:gap-2">
              <span className="text-base sm:text-2xl font-black text-blue-700 dark:text-blue-300">
                {home}
              </span>
              <span className="text-sm sm:text-xl text-blue-400">—</span>
              <span className="text-base sm:text-2xl font-black text-blue-700 dark:text-blue-300">
                {away}
              </span>
            </span>
          ) : (
            <span className="text-blue-400 font-black uppercase tracking-wide">vs</span>
          )}
        </span>

        <span className="font-bold text-sm sm:text-base text-blue-900 dark:text-blue-100 min-w-0 truncate text-right">
          {abbreviateClub(partido.equipo_visitante)}
        </span>
      </div>

      <div className="text-xs text-blue-500 dark:text-blue-300 mt-1">
        {partido.pista}
      </div>
    </div>
  );
}
