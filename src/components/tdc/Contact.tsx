"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, Instagram, Send as TelegramIcon, CalendarClock, Loader2, Plus, MapPin, Clock3 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTdc, st, parseJson } from "./store";
import { t, UI } from "./i18n";
import { SectionHead } from "./SectionHead";
import { toast } from "sonner";

interface FaqItem {
  qFa: string;
  qEn: string;
  aFa: string;
  aEn: string;
}

export function Faq() {
  const { site, lang } = useTdc();
  const items = parseJson<FaqItem[]>(site?.settings?.faq, []);
  return (
    <section id="faq" className="relative bg-background py-24">
      <div className="mx-auto max-w-3xl px-4">
        <SectionHead settingKey="faq" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-10"
        >
          <Accordion type="single" collapsible className="w-full">
            {items.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-white/10">
                <AccordionTrigger className="py-5 text-start text-[15px] font-bold text-white/90 hover:text-orange-400 hover:no-underline [&[data-state=open]]:text-orange-400">
                  {lang === "fa" ? item.qFa : item.qEn}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-8 text-white/60">
                  {lang === "fa" ? item.aFa : item.aEn}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}

export function TalkToUs() {
  const { site, lang } = useTdc();
  const s = site?.settings;
  const [form, setForm] = useState({ name: "", email: "", phone: "", topic: "GENERAL", message: "" });
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error(lang === "fa" ? "نام، ایمیل و پیام الزامی است" : "Name, email and message are required");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success(t(UI.contact.sent, lang));
        setForm({ name: "", email: "", phone: "", topic: "GENERAL", message: "" });
      } else toast.error(t(UI.common.error, lang));
    } finally {
      setSending(false);
    }
  };

  const contacts = [
    { icon: Phone, label: lang === "fa" ? "تلفن" : "Phone", value: s?.phone1 || "", href: `tel:${s?.phone1}`, extra: s?.phone2 ? `tel:${s.phone2}` : "" },
    { icon: Mail, label: "Email", value: s?.email || "", href: `mailto:${s?.email}` },
    { icon: Instagram, label: "Instagram", value: "@timar_dental", href: s?.instagram || "#" },
    { icon: TelegramIcon, label: "Telegram", value: "@Timar_Dental", href: s?.telegram || "#" },
  ];

  return (
    <section id="contact" className="relative bg-surface py-24">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHead settingKey="talk" />

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          {/* Book a call */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="card-hover flex flex-col rounded-3xl border border-white/10 bg-card p-8"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-500/15">
              <CalendarClock className="h-6 w-6 text-orange-400" />
            </span>
            <h3 className="mt-5 text-xl font-extrabold text-white">{t(UI.contact.book, lang)}</h3>
            <p className="mt-2 flex-1 text-sm leading-7 text-white/55">{t(UI.contact.bookDesc, lang)}</p>
            <div className="mt-5 space-y-2 text-sm text-white/70">
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-orange-400" />
                <a href={`tel:${s?.phone1}`} dir="ltr" className="font-display tabular-nums hover:text-orange-300">{s?.phone1}</a>
                <span className="text-white/30">|</span>
                <a href={`tel:${s?.phone2}`} dir="ltr" className="font-display tabular-nums hover:text-orange-300">{s?.phone2}</a>
              </p>
              <p className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-orange-400" />
                {lang === "fa" ? s?.workingHoursFa : s?.workingHoursEn}
              </p>
              {s?.addressFa && (
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-orange-400" />
                  {lang === "fa" ? s?.addressFa : s?.addressEn}
                </p>
              )}
            </div>
            <Button
              className="mt-6 rounded-full bg-gradient-to-l from-orange-600 to-orange-500 font-bold text-white"
              onClick={() => (window.location.href = `tel:${s?.phone1}`)}
            >
              {t(UI.contact.bookBtn, lang)}
            </Button>
          </motion.div>

          {/* Inquiry form */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="rounded-3xl border border-white/10 bg-card p-8"
          >
            <h3 className="text-xl font-extrabold text-white">{t(UI.contact.inquiry, lang)}</h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t(UI.contact.name, lang)}
                className="rounded-xl border-white/15 bg-white/5 text-white placeholder:text-white/30"
                aria-label={t(UI.contact.name, lang)}
              />
              <Input
                type="email"
                dir="ltr"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={t(UI.contact.email, lang)}
                className="rounded-xl border-white/15 bg-white/5 text-white placeholder:text-white/30"
                aria-label={t(UI.contact.email, lang)}
              />
              <Input
                dir="ltr"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder={t(UI.contact.phone, lang)}
                className="rounded-xl border-white/15 bg-white/5 text-white placeholder:text-white/30"
                aria-label={t(UI.contact.phone, lang)}
              />
              <Select value={form.topic} onValueChange={(v) => setForm({ ...form, topic: v })}>
                <SelectTrigger className="rounded-xl border-white/15 bg-white/5 text-white" aria-label={t(UI.contact.topic, lang)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#161a21] text-white">
                  {Object.entries(UI.contact.topics).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{t(v, lang)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder={t(UI.contact.message, lang)}
                rows={4}
                className="rounded-xl border-white/15 bg-white/5 text-white placeholder:text-white/30 sm:col-span-2"
                aria-label={t(UI.contact.message, lang)}
              />
            </div>
            <Button
              onClick={submit}
              disabled={sending}
              className="mt-4 w-full rounded-full bg-gradient-to-l from-orange-600 to-orange-500 py-3 font-bold text-white"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : t(UI.contact.send, lang)}
            </Button>
          </motion.div>
        </div>

        {/* Social row */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {contacts.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target={c.href?.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white/75 transition hover:border-orange-500/50 hover:text-orange-300"
            >
              <c.icon className="h-4 w-4 text-orange-400" />
              <span dir="ltr">{c.value}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CtaBand() {
  const { lang, user, openOverlay } = useTdc();
  const onSend = () => {
    if (!user) openOverlay({ type: "auth", tab: "register" });
    else openOverlay({ type: user.role === "ADMIN" ? "admin" : "lab", tab: user.role === "ADMIN" ? "cases" : "newCase" });
  };
  return (
    <section className="relative overflow-hidden bg-background py-20">
      <div className="absolute start-1/2 top-1/2 h-72 w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-600/15 blur-[110px]" aria-hidden />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative mx-auto max-w-3xl px-4 text-center"
      >
        <h2 className="text-3xl font-black text-white sm:text-4xl">{t(UI.cta.title, lang)}</h2>
        <p className="mt-3 text-white/55">{t(UI.cta.sub, lang)}</p>
        <Button
          size="lg"
          onClick={onSend}
          className="mt-8 rounded-full bg-gradient-to-l from-orange-600 to-orange-500 px-9 py-6 text-lg font-black text-white shadow-2xl shadow-orange-500/40 hover:brightness-110"
        >
          {t(UI.cta.btn, lang)}
        </Button>
      </motion.div>
    </section>
  );
}
