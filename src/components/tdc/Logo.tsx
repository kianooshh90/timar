"use client";

import { useTdc } from "./store";

export function Logo({ compact = false }: { compact?: boolean }) {
  const lang = useTdc((s) => s.lang);
  return (
    <div className="flex items-center gap-2.5 select-none" aria-label="TDC — Timar Dental Center">
      <span
        className="grid place-items-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/30 w-9 h-9 font-display font-bold text-lg leading-none"
        aria-hidden
      >
        t
      </span>
      <span className="flex flex-col leading-none" dir="ltr">
        <span className="font-display font-bold text-xl tracking-tight text-white">
          tdc<span className="text-orange-500">.</span>
        </span>
        {!compact && (
          <span className="text-[9px] uppercase tracking-[0.18em] text-white/50 mt-1">
            {lang === "fa" ? "تیمار دنتال سنتر" : "Timar Dental Center"}
          </span>
        )}
      </span>
    </div>
  );
}
