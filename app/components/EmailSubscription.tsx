"use client";

import { useState } from "react";

export function EmailSubscription() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || "No se pudo registrar");
      setMessage("Registrado. Te avisaremos si cambia la agenda.");
      setEmail("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2 sm:items-center">
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="Tu email"
        className="w-full sm:w-64 px-3 py-2 rounded-lg border border-blue-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900 text-sm"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-3 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 text-sm"
      >
        {loading ? "Registrando..." : "Avisarme por email"}
      </button>
      <div className="text-xs">
        {message && <span className="text-blue-700 dark:text-blue-200">{message}</span>}
        {error && <span className="text-red-600">{error}</span>}
      </div>
    </form>
  );
}
