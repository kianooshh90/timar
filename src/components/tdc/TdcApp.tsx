"use client";

import { useEffect, useLayoutEffect } from "react";
import dynamic from "next/dynamic";
import { useTdc, type SiteData } from "./store";
import { Nav } from "./Nav";
import { Hero } from "./Hero";
import { Process, Services } from "./Sections";
import { WhoDesigns } from "./WhoDesigns";
import { Pricing } from "./Pricing";
import { CaseVault } from "./CaseVault";
import { Faq, TalkToUs, CtaBand } from "./Contact";
import { Footer } from "./Footer";

// Heavy panels are loaded in separate chunks, so they don't slow down the first paint for visitors.
const AuthModal = dynamic(() => import("./modals/AuthModal").then((m) => m.AuthModal), { ssr: false });
const PortfolioModal = dynamic(() => import("./modals/PortfolioModal").then((m) => m.PortfolioModal), { ssr: false });
const PolicyModal = dynamic(() => import("./modals/PolicyModal").then((m) => m.PolicyModal), { ssr: false });
const AdminPanel = dynamic(() => import("./modals/AdminPanel").then((m) => m.AdminPanel), { ssr: false });
const LabDashboard = dynamic(() => import("./modals/LabDashboard").then((m) => m.LabDashboard), { ssr: false });

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function TdcApp({ initialSite }: { initialSite?: SiteData | null }) {
  const { lang, refreshSite, refreshUser, overlay } = useTdc();

  // Content comes with the page itself (server-rendered + cached): show it before the first paint.
  useIsoLayoutEffect(() => {
    if (initialSite) useTdc.setState({ site: initialSite, loadingSite: false });
  }, [initialSite]);

  // Initial load
  useEffect(() => {
    const saved = localStorage.getItem("tdc-lang");
    if (saved === "en" || saved === "fa") {
      useTdc.getState().setLang(saved);
    }
    if (!initialSite) refreshSite(); // only needed when the server could not provide the content
    refreshUser();
  }, [refreshSite, refreshUser, initialSite]);

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
