import React from "react";

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10 w-full">
      <h2 className="text-lg sm:text-xl font-bold text-blue-900 dark:text-blue-200 mb-4">
        {title}
      </h2>
      {children}
    </section>
  );
}
