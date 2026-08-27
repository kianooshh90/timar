"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, PenTool, ShieldCheck, PackageCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTdc, parseJson, st } from "./store";
import { t, UI } from "./i18n";
import { SectionHead } from "./SectionHead";

const ICONS = [UploadCloud, PenTool, ShieldCheck, PackageCheck];

interface Step {
  step: string;
  titleFa: string;
  titleEn: string;
  descFa: string;
  descEn: string;
}

export function Process() {
  const { site, lang, user, openOverlay } = useTdc();
  const steps = parseJson<Step[]>(site?.settings?.process, []);
  const [active, setActive] = useState(0);

  const onCta = () => {
    if (!user) openOverlay({ type: "auth", tab: "register" });
    else openOverlay({ type: user.role === "ADMIN" ? "admin" : "lab", tab: user.role === "ADMIN" ? "cases" : "newCase" });
  };

  return (
    <section id="process" className="relative bg-surface py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-start">
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-500">
            {t(UI.process.kicker, lang)}
          </p>
          <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">{t(UI.process.title, lang)}</h2>
          <p className="mt-3 text-white/50">{t(UI.process.subtitle, lang)}</p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => {
            const Icon = ICONS[i % ICONS.length];
            const isActive = active === i;
            return (
              <motion.button
                key={s.step}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                onClick={() => setActive(i)}
                aria-expanded={isActive}
                className={`group relative overflow-hidden rounded-3xl border p-6 text-start transition-all duration-300 ${
                  isActive
                    ? "border-orange-500/60 bg-gradient-to-b from-orange-500/[0.12] to-transparent shadow-[0_20px_60px_-24px_rgba(249,115,22,0.4)]"
                    : "border-white/10 bg-white/[0.03] hover:border-white/25"
                }`}
              >
                <span
                  className={`font-display text-5xl font-bold tabular-nums transition-colors ${
                    isActive ? "text-gradient" : "text-white/15 group-hover:text-white/30"
                  }`}
                >
                  {s.step}
                </span>
                <h3 className="mt-4 flex items-center gap-2 text-lg font-bold text-white">
                  <Icon className={`h-5 w-5 ${isActive ? "text-orange-400" : "text-white/40"}`} />
                  {lang === "fa" ? s.titleFa : s.titleEn}
                </h3>
                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <p className="mt-2 text-sm leading-7 text-white/60">
                        {lang === "fa" ? s.descFa : s.descEn}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
                <span
                  className={`absolute bottom-0 start-0 h-1 rounded-full bg-gradient-to-l from-orange-600 to-amber-400 transition-all duration-500 ${
                    isActive ? "w-full" : "w-0 group-hover:w-1/3"
                  }`}
                />
              </motion.button>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Button
            variant="outline"
            onClick={onCta}
            className="rounded-full border-orange-500/40 bg-orange-500/10 px-6 font-bold text-orange-400 hover:bg-orange-500/20 hover:text-orange-300"
          >
            {lang === "fa" ? "شروع یک کیس" : "Start a case"}
            <ArrowLeft className="ms-1 h-4 w-4 rtl:block ltr:hidden" />
          </Button>
        </div>
      </div>
    </section>
  );
}

export function Services() {
  const { site, lang } = useTdc();
  const services = site?.services ?? [];

  const groups: { key: string; titleFa: string; titleEn: string; descFa: string; descEn: string; cats: string[] }[] = [
    {
      key: "fixed",
      titleFa: "طراحی ثابت (کراون-بریج و ایمپلنت)",
      titleEn: "Fixed (Crown & Bridge + Implant)",
      descFa: "از کاپینگ ساده تا کراوان روی اباتمنت اختصاصی",
      descEn: "From simple copings to crowns over custom abutments",
      cats: ["CROWN_BRIDGE", "IMPLANT"],
    },
    {
      key: "removable",
      titleFa: "رمووابل",
      titleEn: "Removables",
      descFa: "دست‌دندان کامل و پارسیل با ست‌آپ دیجیتال",
      descEn: "Complete & partial dentures with digital setup",
      cats: ["REMOVABLE"],
    },
    {
      key: "arch-smile",
      titleFa: "فول-آرک و طراحی لبخند",
      titleEn: "Full-Arch & Smile Design",
      descFa: "هایبرید، بار و برنامه‌ریزی لبخند دیجیتال",
      descEn: "Hybrids, bars, and digital smile planning",
      cats: ["FULL_ARCH", "DSD"],
    },
  ];

  const scrollToPricing = () => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });

  return (
    <section id="services" className="relative bg-background py-24">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHead settingKey="services" />
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {groups.map((g, gi) => {
            const items = services.filter((sv) => g.cats.includes(sv.category));
            const minPrice = items.length ? Math.min(...items.map((i) => i.price)) : 0;
            return (
              <motion.div
                key={g.key}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: gi * 0.1 }}
                className="card-hover flex flex-col rounded-3xl border border-white/10 bg-surface p-7"
              >
                <h3 className="text-xl font-extrabold text-white">{lang === "fa" ? g.titleFa : g.titleEn}</h3>
                <p className="mt-1.5 text-sm text-white/50">{lang === "fa" ? g.descFa : g.descEn}</p>
                <ul className="mt-5 flex-1 space-y-3">
                  {items.map((sv) => (
                    <li key={sv.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-2 text-white/75">
                        <span className="h-1 w-4 rounded-full bg-orange-500/60" />
                        {lang === "fa" ? sv.name : sv.nameEn}
                      </span>
                      <span className="shrink-0 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-orange-300/90 tabular-nums">
                        {new Intl.NumberFormat(lang === "fa" ? "fa-IR" : "en-US").format(sv.price)}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={scrollToPricing}
                  className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-orange-400 transition hover:gap-2 hover:text-orange-300"
                >
                  {t(UI.services.viewAll, lang)}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
