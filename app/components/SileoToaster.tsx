"use client";

import { Toaster } from "sileo";

export function SileoToaster() {
  return (
    <Toaster
      position="top-center"
      offset={{
        top: 56,
      }}
      options={{
        duration: 2000,
        fill: "#171717",
        styles: { description: "text-white/75" },
      }}
    />
  );
}
