"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowDown, CheckCircle2, Clock3, FlaskConical, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTdc, st, parseJson } from "./store";
import { t, UI } from "./i18n";

interface QueueRow {
  code: string;
  service: string;
  status: "QUEUED" | "IN_DESIGN" | "QC" | "DELIVERED";
}

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  QUEUED: { label: "QUEUED", cls: "bg-white/10 text-white/60" },
  IN_DESIGN: { label: "IN DESIGN", cls: "bg-orange-500/20 text-orange-400" },
  QC: { label: "QC", cls: "bg-teal-500/20 text-teal-300" },
  DELIVERED: { label: "DELIVERED", cls: "bg-emerald-500/20 text-emerald-400" },
};

export function Hero() {
  const { site, lang, openOverlay } = useTdc();
  const s = site?.settings;
  const [rows, setRows] = useState<QueueRow[]>([
    { code: "CB-1042", service: lang === "fa" ? "کراون و بریج" : "Crown & Bridge", status: "QUEUED" },
    { code: "IM-2210", service: lang === "fa" ? "ایمپلنت" : "Implant", status: "IN_DESIGN" },
    { code: "FA-0867", service: lang === "fa" ? "فول-آرک" : "Full-arch", status: "QC" },
    { code: "RM-1183", service: lang === "fa" ? "رمووابل" : "Removable", status: "QUEUED" },
    { code: "CB-1043", service: lang === "fa" ? "کراون و بریج" : "Crown & Bridge", status: "DELIVERED" },
  ]);

  // Cycle statuses live
  useEffect(() => {
    const cycle: QueueRow["status"][] = ["QUEUED", "IN_DESIGN", "QC", "DELIVERED"];
    const timer = setInterval(() => {
      setRows((prev) => {
        const next = [...prev];
        const idx = Math.floor(Math.random() * next.length);
        const cur = cycle.indexOf(next[idx].status);
        next[idx] = { ...next[idx], status: cycle[(cur + 1) % cycle.length] };
        return next;
      });
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  const stats = parseJson<Array<{ value: string; valueEn: string; labelFa: string; labelEn: string }>>(
    s?.heroStats,
    []
  );

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const onPrimary = () => {
    const user = useTdc.getState().user;
    if (!user) openOverlay({ type: "auth", tab: "register" });
    else openOverlay({ type: user.role === "ADMIN" ? "admin" : "lab", tab: user.role === "ADMIN" ? "cases" : "newCase" });
  };

  return (
    <section className="relative overflow-hidden bg-background pb-20 pt-36 sm:pt-44" id="hero">
      {/* Backdrops */}
      <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_35%,black,transparent)]" aria-hidden />
      <div className="absolute -top-40 start-1/4 h-[480px] w-[480px] rounded-full bg-orange-600/20 blur-[140px]" aria-hidden />
      <div className="absolute bottom-0 end-0 h-[320px] w-[320px] rounded-full bg-amber-500/10 blur-[120px]" aria-hidden />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Copy */}
        <div>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-display text-[11px] font-semibold uppercase tracking-[0.3em] text-orange-500"
          >
            {st(s, "heroBadge", lang)}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08 }}
            className="mt-4 text-4xl font-black leading-[1.15] text-white sm:text-5xl lg:text-[3.4rem]"
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
            className="mt-5 max-w-xl text-base leading-8 text-white/60 sm:text-lg"
          >
            {st(s, "heroSubtitle", lang)}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.24 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Button
              size="lg"
              onClick={onPrimary}
              className="group rounded-full bg-gradient-to-l from-orange-600 to-orange-500 px-7 text-base font-bold text-white shadow-xl shadow-orange-500/30 transition hover:shadow-orange-500/50 hover:brightness-110"
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
              className="rounded-full border-white/20 bg-white/5 px-7 text-base font-semibold text-white backdrop-blur hover:bg-white/10 hover:text-white"
            >
              {t(UI.hero.ctaSecondary, lang)}
            </Button>
          </motion.div>

          {/* Formats & software */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-display tracking-widest text-white/40"
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
            className="mt-10 grid max-w-lg grid-cols-3 gap-6"
          >
            {stats.map((stat, i) => (
              <div key={i}>
                <dt className="sr-only">{lang === "fa" ? stat.labelFa : stat.labelEn}</dt>
                <dd className="text-gradient font-display text-3xl font-bold tabular-nums sm:text-4xl">
                  {lang === "fa" ? stat.value : stat.valueEn}
                </dd>
                <dd className="mt-1 text-xs text-white/50">{lang === "fa" ? stat.labelFa : stat.labelEn}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* Live case manager mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-md"
        >
          <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-orange-500/20 via-transparent to-teal-500/10 blur-2xl" aria-hidden />
          <div className="glass relative rounded-3xl border border-white/10 p-1.5 shadow-2xl shadow-black/60">
            {/* window bar */}
            <div className="flex items-center justify-between rounded-2xl bg-[#0c0f13] px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                <span className="ms-2 text-[11px] font-semibold text-white/60">
                  TDC Case Manager
                </span>
              </div>
              <span className="rounded-full bg-orange-500/15 px-2.5 py-1 text-[10px] font-bold text-orange-400 tabular-nums">
                {rows.filter((r) => r.status !== "DELIVERED").length} {t(UI.hero.inQueue, lang)}
              </span>
            </div>
            {/* rows */}
            <div className="space-y-1.5 p-3">
              <AnimatePresence initial={false}>
                {rows.map((row) => (
                  <motion.div
                    key={row.code}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3.5 py-3"
                  >
                    <div className="flex items-center gap-3">
                      {row.status === "DELIVERED" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : row.status === "QC" ? (
                        <ShieldCheck className="h-4 w-4 text-teal-300" />
                      ) : row.status === "IN_DESIGN" ? (
                        <FlaskConical className="h-4 w-4 text-orange-400" />
                      ) : (
                        <Clock3 className="h-4 w-4 text-white/40" />
                      )}
                      <div>
                        <p className="font-display text-xs font-bold tracking-wider text-white/90" dir="ltr">
                          {row.code}
                        </p>
                        <p className="text-[11px] text-white/45">{row.service}</p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 font-display text-[9px] font-bold tracking-widest ${STATUS_STYLE[row.status].cls}`}
                    >
                      {STATUS_STYLE[row.status].label}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {/* footer note */}
            <div className="rounded-2xl bg-[#0c0f13] px-4 py-3 text-center text-[11px] text-white/50">
              {lang === "fa" ? "کیس‌ها را بفرستید، بقیه‌اش با ما." : "Send the case — we handle the rest."}
            </div>
          </div>

          {/* floating badge */}
          <motion.div
            className="absolute -bottom-5 -start-5 hidden items-center gap-2 rounded-2xl border border-white/10 bg-[#14181f]/95 px-4 py-3 shadow-xl sm:flex"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Send className="h-4 w-4 text-orange-400" />
            <div className="text-[11px]">
              <p className="font-bold text-white/90">{lang === "fa" ? "میانگین تحویل" : "Avg. delivery"}</p>
              <p className="text-gradient font-display text-sm font-bold">2h</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
