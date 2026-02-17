import React from "react";
import type { Partido } from "../lib/agenda";

export function MatchCard({ partido }: { partido: Partido }) {
  const [home, away] = partido.resultado ? partido.resultado.split("-") : ["-", "-"];

  return (
    <div className="bg-white/90 dark:bg-slate-800/80 p-5 rounded-2xl border border-blue-200 dark:border-blue-900 shadow-lg flex flex-col gap-2">
      <div className="mb-1 text-xs font-bold text-blue-700 dark:text-blue-200 uppercase tracking-wide">
        <div className="break-words">{partido.categoria}</div>
        <div className="text-blue-600/90 dark:text-blue-200/90">
          {partido.fecha} {partido.hora}
        </div>
      </div>

      {partido.resultado ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <span className="font-bold text-base text-blue-900 dark:text-blue-100 sm:flex-1 sm:min-w-0 break-words text-center sm:text-left">
            {partido.equipo_local}
          </span>
          <span className="flex items-center justify-center gap-2">
            <span className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-300">
              {home}
            </span>
            <span className="text-base sm:text-xl text-blue-400">—</span>
            <span className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-300">
              {away}
            </span>
          </span>
          <span className="font-bold text-base text-blue-900 dark:text-blue-100 sm:flex-1 sm:min-w-0 break-words text-center sm:text-right">
            {partido.equipo_visitante}
          </span>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span className="font-bold text-base text-blue-900 dark:text-blue-100 break-words text-center sm:text-left">
            {partido.equipo_local}
          </span>
          <span className="text-blue-400 text-center">vs</span>
          <span className="font-bold text-base text-blue-900 dark:text-blue-100 break-words text-center sm:text-right">
            {partido.equipo_visitante}
          </span>
        </div>
      )}

      <div className="text-xs text-blue-500 dark:text-blue-300 mt-1">
        {partido.pista}
      </div>
    </div>
  );
}
