"use client";

import { useState } from "react";
import { Download, FileDown, FolderOpen, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTdc, parseJson } from "../store";
import { t, UI, fmtBytes } from "../i18n";

export function PortfolioModal() {
  const { site, lang, overlay, closeOverlay, user, openOverlay } = useTdc();
  const open = overlay?.type === "portfolio";
  const item = open ? site?.portfolio.find((p) => p.id === (overlay as { itemId: string }).itemId) : null;
  const [imgIdx, setImgIdx] = useState(0);

  if (!item) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && closeOverlay()}>
        <DialogContent className="border-white/10 bg-[#101318] text-white">
          <DialogHeader>
            <DialogTitle className="sr-only">Portfolio</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const images = parseJson<string[]>(item.images, []);
  const files = parseJson<{ path: string; name: string; size: number }[]>(item.files, []);
  const title = lang === "fa" ? item.title : item.titleEn || item.title;
  const desc = lang === "fa" ? item.description : item.descriptionEn || item.description;

  const onSendCase = () => {
    closeOverlay();
    if (!user) openOverlay({ type: "auth", tab: "register" });
    else openOverlay({ type: user.role === "ADMIN" ? "admin" : "lab", tab: user.role === "ADMIN" ? "cases" : "newCase" });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeOverlay()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto thin-scroll border-white/10 bg-[#101318] p-0 text-white sm:max-w-2xl">
        {/* Gallery */}
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-2xl bg-black">
          {images[imgIdx] && (
            <Image
              src={images[imgIdx]}
              alt={title}
              fill
              sizes="(max-width:768px) 100vw, 672px"
              className="object-cover"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#101318] via-transparent to-transparent" />
          {item.badge && (
            <span className="absolute start-4 top-4 rounded-full bg-black/60 px-3 py-1 font-display text-[10px] font-bold tracking-[0.15em] text-orange-300 backdrop-blur">
              {item.badge}
            </span>
          )}
          {images.length > 1 && (
            <div className="absolute bottom-3 start-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  aria-label={`image ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${i === imgIdx ? "w-6 bg-orange-500" : "w-2 bg-white/40"}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5 p-6 sm:p-8">
          <div>
            <h2 className="text-2xl font-black">{title}</h2>
            <p className="mt-2 leading-8 text-white/60">{desc}</p>
          </div>

          {/* Downloadable files */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-orange-400">
              <FolderOpen className="h-4 w-4" />
              {t(UI.vault.files, lang)}
            </h3>
            {files.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {files.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold" dir="ltr">{f.name}</p>
                      <p className="text-[11px] text-white/40">{fmtBytes(f.size, lang)}</p>
                    </div>
                    <Button
                      size="sm"
                      className="shrink-0 rounded-full bg-gradient-to-l from-orange-600 to-orange-500 px-4 font-bold text-white hover:brightness-110"
                      onClick={() => {
                        window.location.href = `/api/download?p=${encodeURIComponent(f.path)}&item=${item.id}`;
                      }}
                    >
                      <FileDown className="me-1 h-4 w-4" />
                      {lang === "fa" ? "دانلود" : "Download"}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/40">
                {t(UI.vault.noFiles, lang)}
              </p>
            )}
          </div>

          {/* CTA */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-orange-500/25 bg-orange-500/[0.06] p-4">
            <p className="text-sm font-semibold text-white/80">
              {lang === "fa" ? "طراحی مشابهی برای کیس شما انجام می‌شود" : "We can design the same for your case"}
            </p>
            <Button
              onClick={onSendCase}
              className="rounded-full bg-gradient-to-l from-orange-600 to-orange-500 px-5 font-bold text-white"
            >
              {lang === "fa" ? "ارسال کیس" : "Send a case"}
              <ArrowLeft className="ms-1 h-4 w-4" />
            </Button>
          </div>
          <p className="flex items-center gap-1.5 text-[11px] text-white/35">
            <Download className="h-3 w-3" />
            {lang === "fa"
              ? `دانلود فایل‌ها برای همه آزاد است — ${item.downloads} دانلود تاکنون`
              : `Downloads are free for everyone — ${item.downloads} so far`}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
