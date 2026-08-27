"use client";

import { useEffect } from "react";
import { useTdc } from "./store";
import { Nav } from "./Nav";
import { Hero } from "./Hero";
import { Process, Services } from "./Sections";
import { WhoDesigns } from "./WhoDesigns";
import { Pricing } from "./Pricing";
import { CaseVault } from "./CaseVault";
import { Faq, TalkToUs, CtaBand } from "./Contact";
import { Footer } from "./Footer";
import { AuthModal } from "./modals/AuthModal";
import { PortfolioModal } from "./modals/PortfolioModal";
import { PolicyModal } from "./modals/PolicyModal";
import { AdminPanel } from "./modals/AdminPanel";
import { LabDashboard } from "./modals/LabDashboard";

export function TdcApp() {
  const { lang, refreshSite, refreshUser, overlay } = useTdc();

  // Initial load
  useEffect(() => {
    const saved = localStorage.getItem("tdc-lang");
    if (saved === "en" || saved === "fa") {
      useTdc.getState().setLang(saved);
    }
    refreshSite();
    refreshUser();
  }, [refreshSite, refreshUser]);

  // Keep <html> dir/lang in sync
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
  }, [lang]);

  // Lock body scroll when a full-screen panel is open
  useEffect(() => {
    const panelOpen = overlay?.type === "admin" || overlay?.type === "lab";
    document.body.style.overflow = panelOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [overlay]);

  return (
    <div dir={lang === "fa" ? "rtl" : "ltr"} className="flex min-h-screen flex-col bg-background">
      <Nav />
      <main className="flex-1">
        <Hero />
        <Process />
        <Services />
        <WhoDesigns />
        <Pricing />
        <CaseVault />
        <Faq />
        <TalkToUs />
        <CtaBand />
      </main>
      <Footer />

      {/* Overlays */}
      <AuthModal />
      <PortfolioModal />
      <PolicyModal />
      <AdminPanel />
      <LabDashboard />
    </div>
  );
}
