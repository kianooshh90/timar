"use client";

import { create } from "zustand";

export type Lang = "fa" | "en";

export interface SavedFile {
  path: string;
  name: string;
  size: number;
}

export interface ServiceItem {
  id: string;
  category: string;
  name: string;
  nameEn: string;
  price: number;
  unit: string;
  turnaround: string;
  active: boolean;
  sortOrder: number;
}

export interface PortfolioItem {
  id: string;
  title: string;
  titleEn: string | null;
  description: string;
  descriptionEn: string | null;
  category: string;
  badge: string | null;
  images: string; // JSON
  files: string; // JSON
  published: boolean;
  sortOrder: number;
  views: number;
  downloads: number;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "LAB";
  labName?: string | null;
  phone?: string | null;
  city?: string | null;
  points: number;
  referralCode?: string | null;
}

export interface CaseMessageItem {
  id: string;
  caseId: string;
  fromAdmin: boolean;
  body: string;
  createdAt: string;
}

export interface CaseItem {
  id: string;
  code: string;
  userId: string;
  patientName?: string | null;
  toothNumbers?: string | null;
  serviceType: string;
  notes?: string | null;
  status: "RECEIVED" | "IN_DESIGN" | "QC" | "DELIVERED" | "CANCELLED";
  adminNote?: string | null;
  price?: number | null;
  files: string;
  deliveryFiles: string;
  createdAt: string;
  updatedAt: string;
  messages?: CaseMessageItem[];
  user?: { name: string; labName?: string | null; email: string; phone?: string | null };
}

export interface InquiryItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  topic: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface SiteData {
  settings: Record<string, string>;
  services: ServiceItem[];
  portfolio: PortfolioItem[];
}

export type OverlayView =
  | { type: "auth"; tab?: "login" | "register" }
  | { type: "portfolio"; itemId: string }
  | { type: "policy"; tab?: "terms" | "privacy" | "refund" }
  | { type: "admin"; tab?: string }
  | { type: "lab"; tab?: string };

interface TdcState {
  lang: Lang;
  user: UserInfo | null;
  site: SiteData | null;
  loadingSite: boolean;
  overlay: OverlayView | null;
  mobileMenu: boolean;
  setLang: (l: Lang) => void;
  setUser: (u: UserInfo | null) => void;
  setSite: (s: SiteData) => void;
  setLoadingSite: (b: boolean) => void;
  openOverlay: (v: OverlayView) => void;
  closeOverlay: () => void;
  setMobileMenu: (b: boolean) => void;
  refreshSite: () => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useTdc = create<TdcState>((set) => ({
  lang: "fa",
  user: null,
  site: null,
  loadingSite: true,
  overlay: null,
  mobileMenu: false,
  setLang: (l) => {
    set({ lang: l, mobileMenu: false });
    if (typeof document !== "undefined") {
      document.documentElement.lang = l;
      document.documentElement.dir = l === "fa" ? "rtl" : "ltr";
      localStorage.setItem("tdc-lang", l);
    }
  },
  setUser: (u) => set({ user: u }),
  setSite: (s) => set({ site: s }),
  setLoadingSite: (b) => set({ loadingSite: b }),
  openOverlay: (v) => set({ overlay: v, mobileMenu: false }),
  closeOverlay: () => set({ overlay: null }),
  setMobileMenu: (b) => set({ mobileMenu: b }),
  refreshSite: async () => {
    try {
      const res = await fetch("/api/site", { cache: "no-store" });
      const data = await res.json();
      set({ site: data, loadingSite: false });
    } catch {
      set({ loadingSite: false });
    }
  },
  refreshUser: async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      set({ user: data.user ?? null });
    } catch {
      set({ user: null });
    }
  },
  logout: async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    set({ user: null, overlay: null });
  },
}));

/** Pick localized value: settings key like heroTitle → heroTitleFa / heroTitleEn */
export function st(settings: Record<string, string> | undefined, key: string, lang: Lang): string {
  if (!settings) return "";
  const fa = settings[`${key}Fa`] ?? settings[key] ?? "";
  const en = settings[`${key}En`] ?? settings[key] ?? "";
  return (lang === "fa" ? fa : en) || fa || en;
}

export function parseJson<T>(raw: string | undefined | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
