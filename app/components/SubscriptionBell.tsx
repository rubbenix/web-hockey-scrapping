"use client";

import { useEffect, useId, useRef, useState } from "react";
import { EmailSubscription } from "./EmailSubscription";

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M12 22a2.02 2.02 0 0 1-2.01-2h4a2.02 2.02 0 0 1-.15.78a2.042 2.042 0 0 1-1.44 1.18h-.047A1.922 1.922 0 0 1 12 22Zm8-3H4v-2l2-1v-5.5a8.065 8.065 0 0 1 .924-4.06A4.654 4.654 0 0 1 10 4.18V2h4v2.18c2.579.614 4 2.858 4 6.32V16l2 1v2Z" />
    </svg>
  );
}

export function SubscriptionBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const dialogId = useId();

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    function onPointerDown(e: MouseEvent | PointerEvent) {
      const target = e.target as Node | null;
      if (!target) return;

      const inPanel = panelRef.current?.contains(target);
      const inButton = buttonRef.current?.contains(target);
      if (!inPanel && !inButton) setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div className="relative flex items-center justify-end">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-blue-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900 text-slate-800 dark:text-slate-100 hover:bg-white disabled:opacity-60 transition"
      >
        <BellIcon className="h-5 w-5" />
        <span className="sr-only">Avisarme por email</span>
      </button>

      <div
        ref={panelRef}
        id={dialogId}
        role="dialog"
        aria-modal="false"
        className={
          "absolute right-0 top-full mt-2 z-50 w-[min(92vw,520px)] " +
          (open
            ? "pointer-events-auto opacity-100 translate-y-0"
            : "pointer-events-none opacity-0 -translate-y-1")
        }
      >
        <div className="rounded-2xl border border-blue-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 shadow-xl backdrop-blur p-4 transition">
          <EmailSubscription onSuccess={() => setOpen(false)} />
        </div>
      </div>
    </div>
  );
}
