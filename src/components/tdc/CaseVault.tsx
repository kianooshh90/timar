"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Eye, FolderOpen } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useTdc, parseJson, st, type PortfolioItem } from "./store";
import { t, UI, VAULT_FILTERS } from "./i18n";
import { SectionHead } from "./SectionHead";

export function CaseVault() {
  const { site, lang, user, openOverlay } = useTdc();
  const [filter, setFilter] = useState("ALL");

  const items = useMemo(() => {
    const all = (site?.portfolio ?? []).filter((p) => p.published);
    return filter === "ALL" ? all : all.filter((p) => p.category === filter);
  }, [site?.portfolio, filter]);

  const onSend = () => {
    if (!user) openOverlay({ type: "auth", tab: "register" });
    else openOverlay({ type: user.role === "ADMIN" ? "admin" : "lab", tab: user.role === "ADMIN" ? "cases" : "newCase" });
  };

  return (
    <section id="vault" className="relative bg-surface py-24">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHead settingKey="vault" />

        {/* Filters */}
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {VAULT_FILTERS.map((f) => {
            const count =
              f.key === "ALL"
                ? site?.portfolio.filter((p) => p.published).length ?? 0
                : site?.portfolio.filter((p) => p.published && p.category === f.key).length ?? 0;
            if (f.key !== "ALL" && count === 0) return null;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                  filter === f.key
                    ? "border-orange-500 bg-orange-500/15 text-orange-400 shadow-lg shadow-orange-500/10"
                    : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/25 hover:text-white"
                }`}
              >
                {t(f.label, lang)}
                <span className="ms-1.5 text-[10px] opacity-60 tabular-nums">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <motion.div layout className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <VaultCard key={item.id} item={item} />
            ))}
          </AnimatePresence>
        </motion.div>

        {items.length === 0 && (
          <p className="mt-16 text-center text-white/40">{t(UI.common.noData, lang)}</p>
        )}

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <p className="text-base font-bold text-white">{t(UI.vault.like, lang)}</p>
          <Button
            onClick={onSend}
            className="rounded-full bg-gradient-to-l from-orange-600 to-orange-500 px-6 font-bold text-white shadow-lg shadow-orange-500/25 hover:brightness-110"
          >
            {t(UI.vault.sendFirst, lang)}
          </Button>
        </div>
      </div>
    </section>
  );
}

function VaultCard({ item }: { item: PortfolioItem }) {
  const { lang, openOverlay } = useTdc();
  const images = parseJson<string[]>(item.images, []);
  const files = parseJson<{ path: string; name: string; size: number }[]>(item.files, []);
  const title = lang === "fa" ? item.title : item.titleEn || item.title;
  const desc = lang === "fa" ? item.description : item.descriptionEn || item.description;
  const img = images[0] || "/images/portfolio/zirconia-crowns.png";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.35 }}
      className="card-hover group overflow-hidden rounded-3xl border border-white/10 bg-card"
    >
      <button
        className="relative block w-full overflow-hidden text-start"
        onClick={() => openOverlay({ type: "portfolio", itemId: item.id })}
        aria-label={title}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-[#0d1014]">
          <Image
            src={img}
            alt={title}
            fill
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />
          {item.badge && (
            <span className="absolute start-3 top-3 rounded-full bg-black/60 px-3 py-1 font-display text-[10px] font-bold tracking-[0.15em] text-orange-300 backdrop-blur">
              {item.badge}
            </span>
          )}
          <span className="absolute bottom-3 end-3 grid h-9 w-9 translate-y-2 place-items-center rounded-full bg-orange-500 text-white opacity-0 shadow-lg shadow-orange-500/40 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <Eye className="h-4 w-4" />
          </span>
        </div>
      </button>
      <div className="p-5">
        <h3 className="text-base font-extrabold text-white">{title}</h3>
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-white/50">{desc}</p>

        {files.length > 0 ? (
          <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-orange-500/25 bg-orange-500/[0.06] px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <FolderOpen className="h-4 w-4 shrink-0 text-orange-400" />
              <span className="truncate text-xs font-semibold text-white/75" dir="ltr">
                {files[0].name}
                {files.length > 1 && <span className="text-white/40"> +{files.length - 1}</span>}
              </span>
            </div>
            <Button
              size="sm"
              className="h-8 shrink-0 rounded-full bg-orange-500/90 px-3 text-xs font-bold text-white hover:bg-orange-400"
              onClick={() => {
                window.location.href = `/api/download?p=${encodeURIComponent(files[0].path)}&item=${item.id}`;
              }}
            >
              <Download className="me-1 h-3.5 w-3.5" />
              {lang === "fa" ? "دانلود" : "Download"}
            </Button>
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-center text-xs text-white/40">
            {t(UI.vault.noFiles, lang)}
          </p>
        )}

        <button
          onClick={() => openOverlay({ type: "portfolio", itemId: item.id })}
          className="mt-3 text-xs font-bold text-orange-400 transition hover:text-orange-300"
        >
          {t(UI.vault.view, lang)} →
        </button>
      </div>
    </motion.article>
  );
}
