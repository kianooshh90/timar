"use client";

import { motion } from "framer-motion";
import { useTdc } from "./store";
import { st } from "./store";

export function SectionHead({ settingKey, fallbackKicker }: { settingKey: string; fallbackKicker?: string }) {
  const { site, lang } = useTdc();
  const s = site?.settings;
  const kicker = st(s, `${settingKey}Kicker`, lang) || fallbackKicker || "";
  const title = st(s, `${settingKey}Title`, lang);
  const subtitle = st(s, `${settingKey}Subtitle`, lang);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-2xl text-center"
    >
      {kicker && (
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-500">
          {kicker}
        </p>
      )}
      {title && <h2 className="mt-3 text-3xl font-extrabold leading-tight text-white sm:text-4xl">{title}</h2>}
      {subtitle && <p className="mt-4 text-base leading-relaxed text-white/60">{subtitle}</p>}
    </motion.div>
  );
}
