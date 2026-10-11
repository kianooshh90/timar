"use client";

import { Instagram, Send as TelegramIcon, Phone, Mail, FileText, ShieldCheck, RefreshCcw } from "lucide-react";
import { useTdc } from "./store";
import { Logo } from "./Logo";
import { UI } from "./i18n";

export function Footer() {
  const { site, lang, openOverlay } = useTdc();
  const s = site?.settings;
  const year = new Date().getFullYear();

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const policies = [
    { key: "terms" as const, label: lang === "fa" ? "شرایط خدمات" : "Terms of Service", icon: FileText },
    { key: "privacy" as const, label: lang === "fa" ? "حریم خصوصی" : "Privacy Policy", icon: ShieldCheck },
    { key: "refund" as const, label: lang === "fa" ? "اصلاحات و بازگشت وجه" : "Refund & Revision", icon: RefreshCcw },
  ];

  return (
    <footer className="mt-auto border-t border-white/10 bg-[#08090c]">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-7 text-white/45">
              {lang === "fa" ? s?.footerAboutFa : s?.footerAboutEn}
            </p>
            <div className="mt-5 flex gap-2">
              {s?.instagram && (
                <a
                  href={s.instagram}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/60 transition hover:border-orange-500/50 hover:text-orange-400"
                >
                  <Instagram className="h-4.5 w-4.5" />
                </a>
              )}
              {s?.telegram && (
                <a
                  href={s.telegram}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Telegram"
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/60 transition hover:border-orange-500/50 hover:text-orange-400"
                >
                  <TelegramIcon className="h-4.5 w-4.5" />
                </a>
              )}
              {s?.phone1 && (
                <a
                  href={`tel:${s.phone1}`}
                  aria-label="Phone"
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/60 transition hover:border-orange-500/50 hover:text-orange-400"
                >
                  <Phone className="h-4.5 w-4.5" />
                </a>
              )}
              {s?.email && (
                <a
                  href={`mailto:${s.email}`}
                  aria-label="Email"
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/60 transition hover:border-orange-500/50 hover:text-orange-400"
                >
                  <Mail className="h-4.5 w-4.5" />
                </a>
              )}
            </div>
          </div>

          {/* Links */}
          <nav aria-label="Footer">
            <h3 className="text-sm font-extrabold text-white">{lang === "fa" ? "دسترسی سریع" : "Quick Links"}</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/50">
              {[
                { id: "process", label: UI.nav.how },
                { id: "services", label: UI.nav.services },
                { id: "pricing", label: UI.nav.pricing },
                { id: "vault", label: UI.nav.vault },
              ].map((l) => (
                <li key={l.id}>
                  <button onClick={() => scrollTo(l.id)} className="transition hover:text-orange-400">
                    {lang === "fa" ? l.label.fa : l.label.en}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Policies */}
          <div>
            <h3 className="text-sm font-extrabold text-white">{lang === "fa" ? "قوانین" : "Legal"}</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/50">
              {policies.map((p) => (
                <li key={p.key}>
                  <button
                    onClick={() => openOverlay({ type: "policy", tab: p.key })}
                    className="transition hover:text-orange-400"
                  >
                    {p.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-extrabold text-white">{lang === "fa" ? "تماس" : "Contact"}</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/50">
              <li className="flex items-center gap-2" dir="ltr">
                <Phone className="h-3.5 w-3.5 text-orange-400" />
                <span className="font-display tabular-nums">{s?.phone1}</span>
              </li>
              <li className="flex items-center gap-2" dir="ltr">
                <Phone className="h-3.5 w-3.5 text-orange-400" />
                <span className="font-display tabular-nums">{s?.phone2}</span>
              </li>
              <li className="flex items-center gap-2" dir="ltr">
                <Mail className="h-3.5 w-3.5 text-orange-400" />
                <span>{s?.email}</span>
              </li>
              <li className="text-xs leading-6 text-white/35">
                {lang === "fa" ? s?.workingHoursFa : s?.workingHoursEn}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/35 sm:flex-row">
          <p>
            © {year} TDC — Timar Dental Center. {lang === "fa" ? "تمام حقوق محفوظ است." : "All rights reserved."}
          </p>
          <p className="font-display tracking-widest" dir="ltr">
            PRECISION <span className="text-orange-500">·</span> ON DEMAND
          </p>
        </div>
      </div>
    </footer>
  );
}
