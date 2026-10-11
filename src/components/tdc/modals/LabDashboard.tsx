"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus, FolderKanban, User, X, Loader2, Send, PackageCheck, Award, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTdc, type CaseItem, type SavedFile, parseJson } from "../store";
import { t, UI, CATEGORIES, fmtToman, fmtDate, fmtBytes } from "../i18n";
import { FileDrop } from "../FileDrop";
import { toast } from "sonner";
import { CaseDetailDialog } from "./CaseDetail";

const FLOW = ["RECEIVED", "IN_DESIGN", "QC", "DELIVERED"] as const;

export function LabDashboard() {
  const { lang, overlay, closeOverlay, user } = useTdc();
  const open = overlay?.type === "lab";
  const initialTab = overlay?.type === "lab" ? (overlay as { tab?: string }).tab ?? "myCases" : "myCases";
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-[#0a0c0f]">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#101318] px-4 py-3 sm:px-6">
        <div>
          <h1 className="text-base font-extrabold text-white sm:text-lg">
            {t(UI.lab.welcome, lang)} {user?.name} 👋
          </h1>
          <p className="text-xs text-white/45">{user?.labName} · {user?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-bold text-orange-300 sm:flex">
            <Award className="h-3.5 w-3.5" />
            {user?.points} {lang === "fa" ? "امتیاز" : "pts"}
          </span>
          <Button size="icon" variant="ghost" className="text-white/60 hover:text-white" onClick={closeOverlay} aria-label={t(UI.common.close, lang)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue={initialTab} className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-4 mt-3 flex w-fit gap-1 rounded-2xl bg-white/5 p-1 sm:mx-6">
          {[
            { key: "newCase", label: UI.lab.newCase, icon: Plus },
            { key: "myCases", label: UI.lab.myCases, icon: FolderKanban },
            { key: "profile", label: UI.lab.profile, icon: User },
          ].map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key} data-lab-tab={tab.key} className="gap-1.5 rounded-xl px-4 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-300">
              <tab.icon className="h-4 w-4" />
              {t(tab.label, lang)}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="min-h-0 flex-1 overflow-y-auto thin-scroll p-4 sm:p-6">
          <TabsContent value="newCase"><NewCaseForm /></TabsContent>
          <TabsContent value="myCases"><MyCases /></TabsContent>
          <TabsContent value="profile"><LabProfile /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

/* ---------- New case ---------- */
function NewCaseForm() {
  const { lang, refreshUser } = useTdc();
  const site = useTdc((s) => s.site);
  const services = site?.services ?? [];
  const [form, setForm] = useState({ serviceType: "CROWN_BRIDGE", patientName: "", toothNumbers: "", notes: "" });
  const [files, setFiles] = useState<SavedFile[]>([]);
  const [busy, setBusy] = useState(false);

  const selectedService = services.find((sv) => sv.category === form.serviceType);
  const hintPrice = selectedService ? selectedService.price : 0;

  const submit = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, files }),
      });
      if (res.ok) {
        toast.success(lang === "fa" ? "کیس ثبت شد! کارشناسان ما شروع می‌کنند." : "Case submitted! Our team is on it.");
        setForm({ serviceType: "CROWN_BRIDGE", patientName: "", toothNumbers: "", notes: "" });
        setFiles([]);
        refreshUser();
        // switch to myCases
        document.querySelector<HTMLButtonElement>('[data-lab-tab="myCases"]')?.click();
      } else toast.error(t(UI.common.error, lang));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h2 className="text-lg font-extrabold text-white">{t(UI.lab.newCase, lang)}</h2>

      <div className="grid gap-4 rounded-3xl border border-white/10 bg-card p-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label className="text-white/70">{lang === "fa" ? "نوع خدمت" : "Service type"}</Label>
          <Select value={form.serviceType} onValueChange={(v) => setForm({ ...form, serviceType: v })}>
            <SelectTrigger className="mt-1.5 rounded-xl border-white/15 bg-white/5 text-white"><SelectValue /></SelectTrigger>
            <SelectContent className="border-white/10 bg-[#161a21] text-white">
              {Object.entries(CATEGORIES).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {lang === "fa" ? v.fa : v.en}
                  {services.some((sv) => sv.category === k) && (
                    <span className="ms-2 text-[10px] text-orange-300">
                      {lang === "fa" ? "از" : "from"} {new Intl.NumberFormat(lang === "fa" ? "fa-IR" : "en-US").format(Math.min(...services.filter((sv) => sv.category === k).map((sv) => sv.price)))}
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hintPrice > 0 && (
            <p className="mt-1.5 text-xs text-white/45">
              {lang === "fa" ? "تعرفه شروع از" : "Starting at"}{" "}
              <span className="font-bold text-orange-300">{fmtToman(hintPrice, lang)}</span>
            </p>
          )}
        </div>
        <div>
          <Label className="text-white/70">{lang === "fa" ? "نام بیمار" : "Patient name"} ({t(UI.common.optional, lang)})</Label>
          <Input value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} className="mt-1.5 rounded-xl border-white/15 bg-white/5 text-white" />
        </div>
        <div>
          <Label className="text-white/70">{lang === "fa" ? "شماره دندان‌ها" : "Tooth numbers"} ({t(UI.common.optional, lang)})</Label>
          <Input value={form.toothNumbers} onChange={(e) => setForm({ ...form, toothNumbers: e.target.value })} className="mt-1.5 rounded-xl border-white/15 bg-white/5 text-white" placeholder="16, 17 ..." />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-white/70">{lang === "fa" ? "دستور کار / توضیحات" : "Case instructions / notes"}</Label>
          <Textarea rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1.5 rounded-xl border-white/15 bg-white/5 text-white" placeholder={lang === "fa" ? "متریال، شید، مارجین، سیستم ایمپلنت…" : "Material, shade, margins, implant system…"} />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-white/70">{lang === "fa" ? "فایل‌های اسکن (STL، PLY…)" : "Scan files (STL, PLY…)"}</Label>
          <div className="mt-1.5">
            <FileDrop kind="case-file" value={files} onChange={setFiles} />
          </div>
        </div>
        <Button onClick={submit} disabled={busy} className="rounded-full bg-gradient-to-l from-orange-600 to-orange-500 py-3 font-bold text-white sm:col-span-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="me-1 h-4 w-4" />}
          {lang === "fa" ? "ثبت کیس" : "Submit case"}
        </Button>
      </div>
    </div>
  );
}

/* ---------- My cases ---------- */
function MyCases() {
  const { lang } = useTdc();
  const [cases, setCases] = useState<CaseItem[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/cases/mine").then((r) => r.json()).then((d) => setCases(d.cases ?? []));
  }, []);
  useEffect(load, [load]);

  if (!cases) return <Spinner />;
  if (cases.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-white/40">{lang === "fa" ? "هنوز کیسی ندارید" : "No cases yet"}</p>
        <Button className="mt-4 rounded-full bg-orange-500 font-bold text-white" onClick={() => document.querySelector<HTMLButtonElement>('[data-lab-tab="newCase"]')?.click()}>
          <Plus className="me-1 h-4 w-4" />
          {t(UI.lab.newCase, lang)}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h2 className="text-lg font-extrabold text-white">{t(UI.lab.myCases, lang)}</h2>
      {cases.map((c) => (
        <button
          key={c.id}
          onClick={() => setSelectedId(c.id)}
          className="w-full rounded-3xl border border-white/10 bg-card p-5 text-start transition hover:border-orange-500/40"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-display rounded-lg bg-orange-500/10 px-3 py-1.5 text-sm font-bold text-orange-300" dir="ltr">{c.code}</span>
            <span className="text-sm text-white/70">{CATEGORIES[c.serviceType] ? (lang === "fa" ? CATEGORIES[c.serviceType].fa : CATEGORIES[c.serviceType].en) : c.serviceType}</span>
            <span className="text-[11px] text-white/35">{fmtDate(c.createdAt, lang)}</span>
            {parseJson<SavedFile[]>(c.deliveryFiles, []).length > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-teal-500/15 px-2.5 py-1 text-[10px] font-bold text-teal-300">
                <PackageCheck className="h-3 w-3" /> {lang === "fa" ? "فایل نهایی آماده است" : "Final files ready"}
              </span>
            )}
            <ChevronRight className="ms-auto h-4 w-4 rotate-180 text-white/30 rtl:rotate-0" />
          </div>
          {/* status flow */}
          <div className="mt-4 flex items-center gap-1">
            {FLOW.map((s, i) => {
              const curIdx = FLOW.indexOf(c.status as (typeof FLOW)[number]);
              const done = c.status !== "CANCELLED" && i <= curIdx;
              return (
                <div key={s} className="flex flex-1 items-center gap-1">
                  <div className="flex flex-col items-center gap-1">
                    <span className={`h-2.5 w-2.5 rounded-full ${done ? "bg-orange-500" : "bg-white/15"} ${i === curIdx ? "animate-pulse-ring" : ""}`} />
                    <span className={`text-[9px] ${i === curIdx ? "font-bold text-orange-300" : "text-white/35"}`}>
                      {t(UI.status[s], lang)}
                    </span>
                  </div>
                  {i < FLOW.length - 1 && <span className={`mb-4 h-0.5 flex-1 ${i < curIdx ? "bg-orange-500/70" : "bg-white/10"}`} />}
                </div>
              );
            })}
          </div>
          {c.adminNote && (
            <p className="mt-3 rounded-xl bg-white/5 px-3 py-2 text-xs text-white/60">
              💬 {c.adminNote}
            </p>
          )}
        </button>
      ))}
      <CaseDetailDialog
        kase={cases.find((c) => c.id === selectedId) ?? null}
        onClose={() => setSelectedId(null)}
        onChanged={load}
        isAdmin={false}
      />
    </div>
  );
}



/* ---------- Profile ---------- */
function LabProfile() {
  const { lang, user, refreshUser } = useTdc();
  const [form, setForm] = useState({
    name: user?.name ?? "",
    labName: user?.labName ?? "",
    phone: user?.phone ?? "",
    city: user?.city ?? "",
    currentPassword: "",
    newPassword: "",
  });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const payload: Record<string, string> = {
      name: form.name,
      labName: form.labName,
      phone: form.phone,
      city: form.city,
    };
    if (form.newPassword) {
      payload.currentPassword = form.currentPassword;
      payload.newPassword = form.newPassword;
    }
    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (res.ok) {
      toast.success(t(UI.admin.saved, lang));
      setForm({ ...form, currentPassword: "", newPassword: "" });
      refreshUser();
    } else {
      const d = await res.json();
      toast.error(d.error === "INVALID_CREDENTIALS" ? (lang === "fa" ? "رمز فعلی اشتباه است" : "Current password is wrong") : t(UI.common.error, lang));
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h2 className="text-lg font-extrabold text-white">{t(UI.lab.profile, lang)}</h2>
      <div className="grid gap-4 rounded-3xl border border-white/10 bg-card p-6 sm:grid-cols-2">
        <div>
          <Label className="text-white/70">{t(UI.auth.name, lang)}</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5 rounded-xl border-white/15 bg-white/5 text-white" />
        </div>
        <div>
          <Label className="text-white/70">{t(UI.auth.labName, lang)}</Label>
          <Input value={form.labName} onChange={(e) => setForm({ ...form, labName: e.target.value })} className="mt-1.5 rounded-xl border-white/15 bg-white/5 text-white" />
        </div>
        <div>
          <Label className="text-white/70">{t(UI.contact.phone, lang)}</Label>
          <Input dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1.5 rounded-xl border-white/15 bg-white/5 text-white tabular-nums" />
        </div>
        <div>
          <Label className="text-white/70">{t(UI.auth.city, lang)}</Label>
          <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="mt-1.5 rounded-xl border-white/15 bg-white/5 text-white" />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-white/70">{lang === "fa" ? "ایمیل (غیرقابل تغییر)" : "Email (fixed)"}</Label>
          <Input dir="ltr" value={user?.email ?? ""} disabled className="mt-1.5 rounded-xl border-white/10 bg-white/[0.03] text-white/40" />
        </div>

        <div className="rounded-2xl border border-orange-500/25 bg-orange-500/[0.05] p-4 sm:col-span-2">
          <p className="text-xs font-bold text-orange-300">
            🎁 {lang === "fa" ? "باشگاه مشتریان (به‌زودی)" : "Customer club (coming soon)"}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-black/20 px-4 py-3">
              <p className="text-[10px] text-white/40">{lang === "fa" ? "کد معرف شما" : "Your referral code"}</p>
              <p className="font-display mt-0.5 font-bold text-white" dir="ltr">{user?.referralCode || "—"}</p>
            </div>
            <div className="rounded-xl bg-black/20 px-4 py-3">
              <p className="text-[10px] text-white/40">{lang === "fa" ? "امتیاز شما" : "Your points"}</p>
              <p className="font-display mt-0.5 font-bold text-white tabular-nums">{user?.points ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="sm:col-span-2">
          <Label className="text-white/70">{lang === "fa" ? "تغییر رمز" : "Change password"}</Label>
          <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
            <Input type="password" dir="ltr" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} placeholder={lang === "fa" ? "رمز فعلی" : "Current password"} className="rounded-xl border-white/15 bg-white/5 text-white placeholder:text-white/25" />
            <Input type="password" dir="ltr" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} placeholder={lang === "fa" ? "رمز جدید" : "New password"} className="rounded-xl border-white/15 bg-white/5 text-white placeholder:text-white/25" />
          </div>
        </div>

        <Button onClick={save} disabled={busy} className="rounded-full bg-gradient-to-l from-orange-600 to-orange-500 py-3 font-bold text-white sm:col-span-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t(UI.admin.save, lang)}
        </Button>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="grid place-items-center py-20">
      <Loader2 className="h-7 w-7 animate-spin text-orange-400" />
    </div>
  );
}
