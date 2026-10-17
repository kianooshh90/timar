"use client";

import { useRef } from "react";
import { RotateCcw, Star, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTdc, imageStyle, type SavedFile } from "../store";

type Patch = Partial<Pick<SavedFile, "fx" | "fy" | "zoom" | "fit">>;

/**
 * Display settings for the images of a portfolio item:
 * which part of the picture stays visible (focus point), how close it is (zoom),
 * and whether the frame is filled (cropped) or the whole picture is shown.
 * Two live previews show exactly what visitors will see: the card and the large window.
 */
export function ImageAdjuster({ images, onChange }: { images: SavedFile[]; onChange: (next: SavedFile[]) => void }) {
  const { lang } = useTdc();
  const fa = lang === "fa";
  if (images.length === 0) return null;

  const patchAt = (i: number, patch: Patch) => onChange(images.map((im, k) => (k === i ? { ...im, ...patch } : im)));
  const makeCover = (i: number) => onChange([images[i], ...images.filter((_, k) => k !== i)]);

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-white/70">{fa ? "تنظیم نمایش عکس‌ها" : "Image display settings"}</Label>
        <p className="mt-1 text-[11px] leading-5 text-white/40">
          {fa
            ? "مشخص کنید از هر عکس کدام قسمت و چه مقدار دیده شود. پیش‌نمایش‌ها دقیقاً همان چیزی است که بازدیدکننده می‌بیند. بعد از تنظیم، «ذخیره» را بزنید."
            : "Choose which part of each picture is shown and how much. The previews are exactly what visitors will see. Press Save when you are done."}
        </p>
      </div>
      {images.map((im, i) => (
        <ImageCard
          key={`${im.path}-${i}`}
          image={im}
          index={i}
          fa={fa}
          onPatch={(p) => patchAt(i, p)}
          onMakeCover={() => makeCover(i)}
        />
      ))}
    </div>
  );
}

function ImageCard({
  image, index, fa, onPatch, onMakeCover,
}: {
  image: SavedFile;
  index: number;
  fa: boolean;
  onPatch: (p: Patch) => void;
  onMakeCover: () => void;
}) {
  const fx = image.fx ?? 50;
  const fy = image.fy ?? 50;
  const zoom = image.zoom ?? 1;
  const fit = image.fit ?? "cover";
  const pickerRef = useRef<HTMLDivElement>(null);
  const style = imageStyle({ fx, fy, zoom, fit });

  const pick = (clientX: number, clientY: number) => {
    const el = pickerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    const x = Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100));
    const y = Math.min(100, Math.max(0, ((clientY - r.top) / r.height) * 100));
    onPatch({ fx: Math.round(x), fy: Math.round(y) });
  };

  const preview = (label: string, ratio: string) => (
    <div>
      <p className="mb-1 text-[10px] text-white/45">{label}</p>
      <div className={`relative overflow-hidden rounded-xl bg-[#0d1014] ${ratio}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.path} alt="" draggable={false} className="absolute inset-0 h-full w-full" style={style} />
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-white/80">
          {fa ? `عکس ${new Intl.NumberFormat("fa-IR").format(index + 1)}` : `Image ${index + 1}`}
        </span>
        {index === 0 ? (
          <span className="flex items-center gap-1 rounded-full bg-orange-500/20 px-2.5 py-0.5 text-[10px] font-bold text-orange-300">
            <Star className="h-3 w-3" />
            {fa ? "تصویر اصلی (روی کارت نمونه‌کار)" : "Main image (shown on the card)"}
          </span>
        ) : (
          <Button type="button" size="sm" variant="ghost" className="h-7 text-[11px] text-white/55 hover:text-orange-300" onClick={onMakeCover}>
            <Star className="me-1 h-3 w-3" />
            {fa ? "انتخاب به‌عنوان تصویر اصلی" : "Make main image"}
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1 flex items-center gap-1 text-[11px] text-white/55">
            <Crosshair className="h-3 w-3" />
            {fa ? "۱) روی عکس کلیک کنید یا بکشید تا قسمت مهم را مشخص کنید" : "1) Click or drag on the picture to mark the important part"}
          </p>
          <div
            ref={pickerRef}
            className="relative cursor-crosshair touch-none select-none overflow-hidden rounded-xl bg-black"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              pick(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (e.buttons === 1) pick(e.clientX, e.clientY);
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.path} alt="" draggable={false} className="block h-auto w-full" />
            <span
              className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-orange-500/70 shadow-[0_0_0_2px_rgba(0,0,0,0.5)]"
              style={{ left: `${fx}%`, top: `${fy}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="mb-1 flex items-center justify-between text-[11px] text-white/55">
              <span>{fa ? "۲) نزدیک‌نمایی (چه مقدار از عکس دیده شود)" : "2) Zoom (how much of the picture is visible)"}</span>
              <b className="tabular-nums text-orange-300" dir="ltr">{zoom.toFixed(2)}×</b>
            </p>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => onPatch({ zoom: Number(e.target.value) })}
              className="w-full accent-orange-500"
              aria-label={fa ? "نزدیک‌نمایی" : "Zoom"}
            />
            <div className="flex justify-between text-[10px] text-white/30">
              <span>{fa ? "همه‌ی عکس" : "Whole picture"}</span>
              <span>{fa ? "خیلی نزدیک" : "Very close"}</span>
            </div>
          </div>

          <div>
            <p className="mb-1 text-[11px] text-white/55">{fa ? "۳) نحوه‌ی نمایش در کادر" : "3) How the picture fills the frame"}</p>
            <div className="flex gap-2">
              {([
                { v: "cover", fa: "پر کردن کادر", en: "Fill the frame" },
                { v: "contain", fa: "نمایش کامل عکس", en: "Show whole picture" },
              ] as const).map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => onPatch({ fit: o.v })}
                  className={`flex-1 rounded-xl border px-2 py-2 text-[11px] font-bold transition ${
                    fit === o.v ? "border-orange-500 bg-orange-500/15 text-orange-300" : "border-white/10 bg-white/5 text-white/55 hover:bg-white/10"
                  }`}
                >
                  {fa ? o.fa : o.en}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 text-[11px] text-white/45 hover:text-white"
            onClick={() => onPatch({ fx: 50, fy: 50, zoom: 1, fit: "cover" })}
          >
            <RotateCcw className="me-1 h-3 w-3" />
            {fa ? "بازگشت به حالت پیش‌فرض" : "Reset"}
          </Button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {preview(fa ? "روی کارت نمونه‌کار" : "On the portfolio card", "aspect-[4/3]")}
        {preview(fa ? "در پنجره‌ی بزرگ" : "In the large window", "aspect-[16/10]")}
      </div>
    </div>
  );
}
