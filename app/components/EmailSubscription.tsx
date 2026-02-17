"use client";

import { useState } from "react";
import { sileo } from "sileo";

export function EmailSubscription({ onSuccess }: { onSuccess?: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || "No s'ha pogut registrar");

      sileo.success({
        title: "Correu guardat"
      });

      setEmail("");

      if (onSuccess) onSuccess();
      setHidden(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
      sileo.error({
        title: "No s'ha pogut guardar",
        description: msg,
      });
    } finally {
      setLoading(false);
    }
  }

  if (hidden) return null;

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2 sm:items-center">
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="El teu email"
        className="w-full sm:w-64 px-3 py-2 rounded-lg border border-blue-900 bg-slate-900 text-blue-200 placeholder-blue-400 text-base sm:text-sm focus:bg-slate-900 focus:text-blue-200 focus:placeholder-blue-400"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-3 py-2 rounded-lg bg-blue-700 text-blue-100 font-semibold hover:bg-blue-600 disabled:opacity-60 text-sm"
      >
        {loading ? "Registrando..." : "Avisa'm per email"}
      </button>
      <div className="text-xs">
        {error && <span className="text-red-400">{error}</span>}
      </div>
    </form>
  );
}
