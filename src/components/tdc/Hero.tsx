"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTdc, st, parseJson, panelFor } from "./store";
import { t, UI } from "./i18n";

export function Hero() {
  const { site, lang, openOverlay } = useTdc();
  const s = site?.settings;

  const stats = parseJson<Array<{ value: string; valueEn: string; labelFa: string; labelEn: string }>>(
    s?.heroStats,
    []
  );

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const onPrimary = () => {
    const user = useTdc.getState().user;
    if (!user) openOverlay({ type: "auth", tab: "register" });
    else openOverlay(panelFor(user, true));
  };

  return (
    <section className="relative overflow-hidden bg-background pb-24 pt-36 sm:pt-44" id="hero">
      {/* Backdrops */}
      <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_35%,black,transparent)]" aria-hidden />
      <div className="absolute -top-40 start-1/4 h-[480px] w-[480px] rounded-full bg-orange-600/20 blur-[140px]" aria-hidden />
      <div className="absolute bottom-0 end-0 h-[320px] w-[320px] rounded-full bg-amber-500/10 blur-[120px]" aria-hidden />

      <div className="relative mx-auto max-w-4xl px-4 text-center">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-orange-500"
        >
          {st(s, "heroBadge", lang)}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.08 }}
          className="mt-5 text-5xl font-black leading-[1.15] text-white sm:text-6xl lg:text-7xl"
        >
          {lang === "fa" ? (
            <>
              طراحی <span className="text-gradient">CAD</span> دقیق دندانپزشکی،
              <br />
              به‌موقع و مطمئن.
            </>
          ) : (
            <>
              Precision <span className="text-gradient">dental CAD</span> design,
              <br />
              on demand.
            </>
          )}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.16 }}
          className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/60 sm:text-xl sm:leading-9"
        >
          {st(s, "heroSubtitle", lang)}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.24 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <Button
            size="lg"
            onClick={onPrimary}
            className="group rounded-full bg-gradient-to-l from-orange-600 to-orange-500 px-8 text-base font-bold text-white shadow-xl shadow-orange-500/30 transition hover:shadow-orange-500/50 hover:brightness-110"
          >
            {t(UI.hero.ctaPrimary, lang)}
            {lang === "fa" ? (
              <ArrowLeft className="ms-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            ) : (
              <ArrowDown className="hidden" />
            )}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => scrollTo("process")}
            className="rounded-full border-white/20 bg-white/5 px-8 text-base font-semibold text-white backdrop-blur hover:bg-white/10 hover:text-white"
          >
            {t(UI.hero.ctaSecondary, lang)}
          </Button>
        </motion.div>

        {/* Formats & software */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs font-display tracking-widest text-white/40"
        >
          <span>
            {t(UI.hero.formats, lang)}:{" "}
            <span className="text-teal-300">{s?.heroFormats || "STL · PLY"}</span>
          </span>
          <span>
            {t(UI.hero.software, lang)}:{" "}
            <span className="text-teal-300">{s?.heroSoftware || "3Shape · exocad"}</span>
          </span>
        </motion.div>

        {/* Stats */}
        <motion.dl
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="mx-auto mt-14 grid max-w-xl grid-cols-3 gap-6"
        >
          {stats.map((stat, i) => (
            <div key={i}>
              <dt className="sr-only">{lang === "fa" ? stat.labelFa : stat.labelEn}</dt>
              <dd className="text-gradient font-display text-4xl font-bold tabular-nums sm:text-5xl">
                {lang === "fa" ? stat.value : stat.valueEn}
              </dd>
              <dd className="mt-1.5 text-sm text-white/50">{lang === "fa" ? stat.labelFa : stat.labelEn}</dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}
