import React from "react";

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10 w-full">
      <h2 className="text-lg sm:text-xl font-bold text-sky-400 dark:text-sky-400 mb-4">
        {title}
      </h2>
      {children}
    </section>
  );
}
