"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-blue-100 via-sky-200 to-blue-300 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-3 sm:px-4 py-6 sm:py-8 flex flex-col items-center">
      <div className="w-full max-w-xl bg-white/90 dark:bg-slate-800/80 p-6 rounded-2xl border border-blue-200 dark:border-blue-900 shadow-lg">
        <h1 className="text-lg font-bold text-blue-900 dark:text-blue-200 mb-2">Algo ha fallado</h1>
        <p className="text-sm text-blue-700 dark:text-blue-200 mb-4">{error.message}</p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    </main>
  );
}
