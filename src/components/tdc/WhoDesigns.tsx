"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, X, MoveHorizontal, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useTdc, st, parseJson } from "./store";
import { t, UI } from "./i18n";

export function WhoDesigns() {
  const { site, lang, user, openOverlay } = useTdc();
  const s = site?.settings;
  const [pos, setPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const left = parseJson<string[]>(s?.compareLeft, []);
  const right = parseJson<string[]>(s?.compareRight, []);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const rtl = document.documentElement.dir === "rtl";
    let pct = ((clientX - rect.left) / rect.width) * 100;
    if (rtl) pct = 100 - pct;
    setPos(Math.min(96, Math.max(4, pct)));
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    updateFromClientX(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragging.current) updateFromClientX(e.clientX);
  };
  const stop = () => (dragging.current = false);

  const onCta = () => {
    if (!user) openOverlay({ type: "auth", tab: "register" });
    else openOverlay({ type: user.role === "ADMIN" ? "admin" : "lab", tab: user.role === "ADMIN" ? "cases" : "newCase" });
  };

  return (
    <section id="who" className="relative overflow-hidden bg-surface py-24">
      <div className="absolute end-0 top-10 h-72 w-72 rounded-full bg-teal-500/5 blur-[100px]" aria-hidden />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-2">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-display text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-500"
          >
            {t(UI.who.kicker, lang)}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="mt-3 text-3xl font-extrabold leading-snug text-white sm:text-4xl"
          >
            {lang === "fa" ? (
              <>
                طراحی هر کیس توسط <span className="text-gradient">متخصصان باتجربه CAD</span> انجام می‌شود.
              </>
            ) : (
              <>
                Case design led by <span className="text-gradient">experienced dental CAD specialists</span>.
              </>
            )}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-4 leading-8 text-white/60"
          >
            {st(s, "whoDesigns", lang)}
          </motion.p>
          <div className="mt-8 overflow-hidden rounded-3xl border border-white/10">
            <Image
              src="/images/site/abutment.png"
              alt={lang === "fa" ? "اباتمنت اختصاصی طراحی‌شده در TDC" : "Custom abutment designed at TDC"}
              width={720}
              height={540}
              className="h-auto w-full object-cover transition-transform duration-700 hover:scale-105"
            />
          </div>
        </div>

        {/* Comparison slider */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
        >
          <div
            ref={containerRef}
            dir="ltr"
            className="relative cursor-ew-resize select-none overflow-hidden rounded-3xl border border-white/10"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={stop}
            onPointerLeave={stop}
            role="slider"
            aria-label={t(UI.who.drag, lang)}
            aria-valuenow={Math.round(pos)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") setPos((p) => Math.min(96, p + 4));
              if (e.key === "ArrowRight") setPos((p) => Math.max(4, p - 4));
            }}
          >
            {/* Right panel (TDC) */}
            <div className="absolute inset-0 bg-gradient-to-b from-teal-950/60 to-[#0c1512] p-6 pt-16">
              <span className="absolute end-4 top-4 rounded-full bg-teal-500/15 px-3 py-1 font-display text-[10px] font-bold tracking-[0.2em] text-teal-300">
                {lang === "fa" ? "TDC" : st(s, "compareRightTitle", lang) || "TDC"}
              </span>
              <ul className="space-y-4">
                {right.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-white/85">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* Left panel (typical vendor) with clip */}
            <div
              className="absolute inset-0 bg-gradient-to-b from-[#1c1113] to-[#150d0f] p-6 pt-16"
              style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
            >
              <span className="absolute start-4 top-4 rounded-full bg-red-500/15 px-3 py-1 font-display text-[10px] font-bold tracking-[0.2em] text-red-400">
                {lang === "fa" ? "تامین‌کننده معمولی" : "TYPICAL VENDOR"}
              </span>
              <ul className="space-y-4">
                {left.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-white/70">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* Handle */}
            <div className="absolute inset-y-0 z-10 w-1 bg-orange-500" style={{ left: `${pos}%` }}>
              <span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500 p-2.5 shadow-xl shadow-orange-500/40">
                <MoveHorizontal className="h-4 w-4 text-white" />
              </span>
            </div>
            {/* min-height wrapper */}
            <div className="pointer-events-none relative h-[340px] w-full" aria-hidden />
          </div>
          <p className="mt-3 text-center font-display text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">
            ← {t(UI.who.drag, lang)} →
          </p>
        </motion.div>
      </div>
    </section>
  );
}
