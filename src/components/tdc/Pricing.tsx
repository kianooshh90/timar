"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Minus, Plus, Mail, Loader2, Infinity as InfinityIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTdc, st } from "./store";
import { t, UI, CATEGORIES, fmtToman } from "./i18n";
import { toast } from "sonner";

export function Pricing() {
  const { site, lang } = useTdc();
  const services = site?.services ?? [];

  const [cat, setCat] = useState<string>(services[0]?.category ?? "CROWN_BRIDGE");
  const activeCat = useMemo(() => (services.some((sv) => sv.category === cat) ? cat : services[0]?.category ?? "CROWN_BRIDGE"), [services, cat]);
  const catServices = useMemo(() => services.filter((sv) => sv.category === activeCat), [services, activeCat]);
  const [typeId, setTypeId] = useState<string>("");
  const activeType = useMemo(
    () => catServices.find((sv) => sv.id === typeId) ?? catServices[0],
    [catServices, typeId]
  );
  const [units, setUnits] = useState(1);

  const [rateEmail, setRateEmail] = useState("");
  const [sending, setSending] = useState(false);

  const estimate = activeType ? activeType.price * units : 0;

  const subscribe = async () => {
    if (!rateEmail.includes("@")) {
      toast.error(lang === "fa" ? "ایمیل معتبر وارد کنید" : "Enter a valid email");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: rateEmail }),
      });
      if (res.ok) {
        toast.success(lang === "fa" ? "ثبت شد! کارتعرفه به ایمیل شما ارسال می‌شود." : "Done! The rate card is on its way.");
        setRateEmail("");
      } else toast.error(t(UI.common.error, lang));
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="pricing" className="relative bg-background py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-500">
            {t(UI.pricing.kicker, lang)}
          </p>
          <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">{st(site?.settings, "pricingTitle", lang)}</h2>
          <p className="mt-3 text-white/55">{st(site?.settings, "pricingSubtitle", lang)}</p>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 px-4 py-1.5 text-xs font-semibold text-teal-300">
            <InfinityIcon className="h-3.5 w-3.5" />
            {t(UI.pricing.includesRevisions, lang)}
          </p>
        </div>

        {/* Price cards per category */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(CATEGORIES).map(([catKey, catLabel], gi) => {
            const items = services.filter((sv) => sv.category === catKey);
            if (items.length === 0) return null;
            return (
              <motion.div
                key={catKey}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: gi * 0.06 }}
                className="card-hover rounded-3xl border border-white/10 bg-surface p-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-white">{lang === "fa" ? catLabel.fa : catLabel.en}</h3>
                  <span className="font-display text-[10px] font-bold uppercase tracking-widest text-orange-400">
                    {catKey === "CROWN_BRIDGE" ? "CB" : catKey === "IMPLANT" ? "IM" : catKey === "REMOVABLE" ? "RM" : catKey === "FULL_ARCH" ? "FA" : "DSD"}
                  </span>
                </div>
                <ul className="mt-4 space-y-3">
                  {items.map((sv) => (
                    <li key={sv.id} className="flex items-baseline justify-between gap-2 border-b border-dashed border-white/10 pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-semibold text-white/85">{lang === "fa" ? sv.name : sv.nameEn}</p>
                        <p className="mt-0.5 text-[11px] text-white/40">{sv.turnaround}</p>
                      </div>
                      <p className="shrink-0 text-end">
                        <span className="text-lg font-extrabold text-orange-400 tabular-nums">
                          {new Intl.NumberFormat(lang === "fa" ? "fa-IR" : "en-US").format(sv.price)}
                        </span>
                        <span className="text-[11px] text-white/45"> {lang === "fa" ? "تومان" : "T"}{sv.unit}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-sm text-white/45">{st(site?.settings, "pricingVolumeNote", lang)}</p>

        {/* Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="mt-10 rounded-3xl border border-white/10 bg-surface p-6 sm:p-8"
        >
          <h3 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-orange-400">
            {t(UI.pricing.calculator, lang)}
          </h3>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_auto_auto_auto] lg:items-end">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-white/50">{t(UI.pricing.category, lang)}</label>
                <Select value={activeCat} onValueChange={(v) => { setCat(v); setTypeId(""); }}>
                  <SelectTrigger className="w-full rounded-xl border-white/15 bg-white/5 text-white" aria-label={t(UI.pricing.category, lang)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#161a21] text-white">
                    {Object.entries(CATEGORIES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{lang === "fa" ? v.fa : v.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-white/50">{t(UI.pricing.type, lang)}</label>
                <Select value={activeType?.id ?? ""} onValueChange={setTypeId}>
                  <SelectTrigger className="w-full rounded-xl border-white/15 bg-white/5 text-white" aria-label={t(UI.pricing.type, lang)}>
                    <SelectValue placeholder={t(UI.pricing.type, lang)} />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#161a21] text-white">
                    {catServices.map((sv) => (
                      <SelectItem key={sv.id} value={sv.id}>{lang === "fa" ? sv.name : sv.nameEn}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-white/50">{t(UI.pricing.units, lang)}</label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => setUnits((u) => Math.max(1, u - 1))} aria-label="-">
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={units}
                    min={1}
                    onChange={(e) => setUnits(Math.max(1, Math.min(999, Number(e.target.value) || 1)))}
                    className="w-24 rounded-xl border-white/15 bg-white/5 text-center text-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                    aria-label={t(UI.pricing.units, lang)}
                  />
                  <Button variant="outline" size="icon" className="rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => setUnits((u) => Math.min(999, u + 1))} aria-label="+">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-orange-500/30 bg-orange-500/[0.07] px-8 py-5 text-center">
              <p className="text-[11px] font-semibold tracking-widest text-white/50">{t(UI.pricing.estimated, lang)}</p>
              <p className="text-gradient mt-1 text-3xl font-black tabular-nums">{fmtToman(estimate, lang)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-8 py-5 text-center">
              <p className="text-[11px] font-semibold tracking-widest text-white/50">{t(UI.pricing.turnaround, lang)}</p>
              <p className="mt-1 text-xl font-bold text-teal-300">{activeType?.turnaround ?? "—"}</p>
            </div>
          </div>
        </motion.div>

        {/* Rate card */}
        <div className="mx-auto mt-12 max-w-xl rounded-3xl border border-teal-500/20 bg-gradient-to-b from-teal-500/[0.08] to-transparent p-7 text-center">
          <h3 className="text-lg font-extrabold text-white">{t(UI.pricing.rateCardTitle, lang)}</h3>
          <p className="mt-1.5 text-sm text-white/55">{t(UI.pricing.rateCardSub, lang)}</p>
          <div className="mt-5 flex gap-2">
            <Input
              type="email"
              dir="ltr"
              value={rateEmail}
              onChange={(e) => setRateEmail(e.target.value)}
              placeholder="you@lab.com"
              className="flex-1 rounded-full border-white/15 bg-white/5 text-white placeholder:text-white/30"
              aria-label={t(UI.contact.email, lang)}
            />
            <Button
              onClick={subscribe}
              disabled={sending}
              className="rounded-full bg-gradient-to-l from-orange-600 to-orange-500 px-6 font-bold text-white"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="me-1 h-4 w-4" />}
              {t(UI.pricing.sendMe, lang)}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
