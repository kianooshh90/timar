"use client";

import { create } from "zustand";

export type Lang = "fa" | "en";

export interface SavedFile {
  path: string; // storage reference / public URL — or, for external links, the https URL itself
  name: string; // original filename, or the note typed by the user for a link
  size: number; // 0 for links
  link?: boolean; // true = external link (Google Drive, Telegram, WeTransfer...), not a file stored by us
}

/** External links are only ever rendered when they are plain https URLs. */
export function isLinkFile(f: { path: string; link?: boolean }): boolean {
  return f.link === true && /^https:\/\//i.test(f.path);
}

export function linkHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
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
  role: "ADMIN" | "LAB" | "DESIGNER";
  username?: string | null;
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
  // --- designer workflow (internal fields are only sent to the admin / the assigned designer) ---
  designerId?: string | null;
  designer?: { id: string; name: string; username?: string | null } | null;
  assignedAt?: string | null;
  dueAt?: string | null;
  designerNote?: string | null;
  submittedAt?: string | null;
  deliveredAt?: string | null;
  revisionCount?: number;
  rating?: number | null; // lab satisfaction 1..5
  ratingComment?: string | null;
  score?: number | null; // admin's score for the designer
  scoreNote?: string | null;
  events?: CaseEventItem[];
}

export interface CaseEventItem {
  id: string;
  caseId: string;
  type: string;
  note?: string | null;
  actorRole?: string | null;
  actorName?: string | null;
  createdAt: string;
}

export interface DesignerStats {
  open: number;
  inDesign: number;
  inReview: number;
  delivered: number;
  overdue: number;
  avgScore: number | null;
  scoredCount: number;
  avgRevisions: number | null;
  avgRating: number | null;
  ratedCount: number;
  onTimeRate: number | null;
  avgTurnaroundHours: number | null;
}

export interface DesignerItem {
  id: string;
  name: string;
  username: string | null;
  phone?: string | null;
  active: boolean;
  createdAt: string;
  stats: DesignerStats;
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
  | { type: "designer"; tab?: string }
  | { type: "lab"; tab?: string };

/** The panel a signed-in user should land on. `newCase` = they clicked a "send a case" button. */
export function panelFor(user: { role: string }, newCase = false): OverlayView {
  if (user.role === "ADMIN") return newCase ? { type: "admin", tab: "cases" } : { type: "admin" };
  if (user.role === "DESIGNER") return { type: "designer" };
  return newCase ? { type: "lab", tab: "newCase" } : { type: "lab" };
}

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

/** Portfolio images may be stored as plain URL strings (seed data) or as {path,name,size} objects (admin uploads). Always return URL strings. */
export function parseImageUrls(raw: string | undefined | null): string[] {
  const arr = parseJson<unknown[]>(raw, []);
  return arr
    .map((x) => (typeof x === "string" ? x : (x as { path?: string } | null)?.path))
    .filter((x): x is string => typeof x === "string" && x.length > 0);
}
