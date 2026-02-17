"use client";
import { useState } from "react";

export default function RefreshButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRefresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agenda?refresh=1");
      if (!res.ok) throw new Error("Error actualizando datos");
      // Refrescar la página para mostrar los nuevos datos
      window.location.reload();
    } catch (e: any) {
      setError(e.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 text-xs"
      >
        {loading ? "Actualizando..." : "Actualizar ahora"}
      </button>
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
    </div>
  );
}
