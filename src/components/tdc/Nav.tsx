"use client";

import { useEffect, useState } from "react";
import { Menu, X, Globe, LayoutDashboard, LogIn, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTdc, st } from "./store";
import { Logo } from "./Logo";
import { t, UI } from "./i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LINKS = [
  { id: "process", label: UI.nav.how },
  { id: "services", label: UI.nav.services },
  { id: "who", label: UI.nav.who },
  { id: "pricing", label: UI.nav.pricing },
  { id: "vault", label: UI.nav.vault },
  { id: "faq", label: UI.nav.faq },
  { id: "contact", label: UI.nav.contact },
];

export function Nav() {
  const { lang, setLang, user, site, openOverlay, logout, mobileMenu, setMobileMenu } = useTdc();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastY, setLastY] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      setHidden(y > 320 && y > lastY + 6);
      setLastY(y);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [lastY]);

  const announcementActive = site?.settings?.announcementActive !== "false";
  const announcement = st(site?.settings, "announcement", lang);

  const scrollTo = (id: string) => {
    setMobileMenu(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onSendCase = () => {
    if (!user) {
      openOverlay({ type: "auth", tab: "register" });
    } else if (user.role === "ADMIN") {
      openOverlay({ type: "admin", tab: "cases" });
    } else {
      openOverlay({ type: "lab", tab: "newCase" });
    }
  };

  return (
    <>
      {announcementActive && announcement && (
        <div className="fixed inset-x-0 top-0 z-[60] bg-gradient-to-l from-orange-600 via-orange-500 to-amber-500 py-2 text-center text-[13px] font-semibold text-black/90 px-10">
          {announcement}
        </div>
      )}

      <header
        className={`fixed inset-x-0 z-50 transition-all duration-500 ${
          announcementActive ? "top-10" : "top-4"
        } ${hidden && !mobileMenu ? "-translate-y-24" : ""}`}
      >
        <div className="mx-auto max-w-6xl px-4">
          <nav
            className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 transition-all duration-500 ${
              scrolled || mobileMenu ? "glass border-white/10 shadow-2xl shadow-black/40" : "border-transparent bg-transparent"
            }`}
            aria-label="Main navigation"
          >
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="TDC home">
              <Logo />
            </button>

            {/* Desktop links */}
            <ul className="hidden items-center gap-1 lg:flex">
              {LINKS.map((l) => (
                <li key={l.id}>
                  <button
                    onClick={() => scrollTo(l.id)}
                    className="whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    {t(l.label, lang)}
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-1.5">
              {/* Language switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1 text-white/70 hover:text-white" aria-label="Language">
                    <Globe className="h-4 w-4" />
                    <span className="font-display text-xs font-bold">{lang.toUpperCase()}</span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="border-white/10 bg-[#161a21] text-white">
                  <DropdownMenuItem onClick={() => setLang("fa")} className={lang === "fa" ? "text-orange-400" : ""}>
                    فارسی
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLang("en")} className={lang === "en" ? "text-orange-400" : ""}>
                    English
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {user ? (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="hidden gap-1.5 text-white/80 hover:text-white sm:inline-flex"
                    onClick={() => openOverlay({ type: user.role === "ADMIN" ? "admin" : "lab" })}
                  >
                    <LayoutDashboard className="h-4 w-4 text-orange-400" />
                    {t(user.role === "ADMIN" ? UI.nav.panel : UI.nav.dashboard, lang)}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="hidden gap-1 text-white/50 hover:text-red-400 sm:inline-flex"
                    onClick={() => logout()}
                    aria-label={t(UI.nav.logout, lang)}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="hidden gap-1.5 text-white/80 hover:text-white sm:inline-flex"
                  onClick={() => openOverlay({ type: "auth", tab: "login" })}
                >
                  <LogIn className="h-4 w-4 text-orange-400" />
                  {t(UI.nav.login, lang)}
                </Button>
              )}

              <Button
                size="sm"
                className="rounded-full bg-gradient-to-l from-orange-600 to-orange-500 px-4 font-bold text-white shadow-lg shadow-orange-500/30 hover:from-orange-500 hover:to-orange-400 animate-pulse-ring"
                onClick={onSendCase}
              >
                {t(UI.nav.sendCase, lang)}
              </Button>

              {/* Mobile toggle */}
              <Button
                size="icon"
                variant="ghost"
                className="text-white/80 lg:hidden"
                onClick={() => setMobileMenu(!mobileMenu)}
                aria-label="Menu"
              >
                {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </nav>

          {/* Mobile menu */}
          {mobileMenu && (
            <div className="mt-2 rounded-2xl border border-white/10 bg-[#0d1014]/95 p-3 shadow-2xl backdrop-blur-xl lg:hidden">
              <ul className="grid grid-cols-2 gap-1">
                {LINKS.map((l) => (
                  <li key={l.id}>
                    <button
                      onClick={() => scrollTo(l.id)}
                      className="w-full rounded-xl px-3 py-2.5 text-start text-sm font-medium text-white/80 transition hover:bg-white/10"
                    >
                      {t(l.label, lang)}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex gap-2 border-t border-white/10 pt-2">
                {user ? (
                  <>
                    <Button
                      size="sm"
                      className="flex-1 bg-white/10 text-white hover:bg-white/15"
                      onClick={() => openOverlay({ type: user.role === "ADMIN" ? "admin" : "lab" })}
                    >
                      <LayoutDashboard className="me-1 h-4 w-4 text-orange-400" />
                      {t(user.role === "ADMIN" ? UI.nav.panel : UI.nav.dashboard, lang)}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-white/60" onClick={() => logout()}>
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    className="flex-1 bg-white/10 text-white hover:bg-white/15"
                    onClick={() => openOverlay({ type: "auth", tab: "login" })}
                  >
                    <LogIn className="me-1 h-4 w-4 text-orange-400" />
                    {t(UI.nav.login, lang)}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
