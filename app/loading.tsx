export default function Loading() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-blue-100 via-sky-200 to-blue-300 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-3 sm:px-4 py-6 sm:py-8 flex flex-col items-center">
      <div className="w-full max-w-3xl mb-10">
        <div className="h-52 sm:h-40 rounded-2xl bg-white/40 dark:bg-slate-800/40 animate-pulse" />
      </div>
      <div className="w-full max-w-4xl space-y-4">
        <div className="h-8 w-48 bg-white/40 dark:bg-slate-800/40 rounded animate-pulse" />
        <div className="h-24 bg-white/40 dark:bg-slate-800/40 rounded-2xl animate-pulse" />
        <div className="h-24 bg-white/40 dark:bg-slate-800/40 rounded-2xl animate-pulse" />
      </div>
    </main>
  );
}
