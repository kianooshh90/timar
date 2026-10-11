"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LayoutDashboard, FolderKanban, Images, Tags, Inbox, Type, Users, X,
  Plus, Trash2, Pencil, Save, Loader2, RefreshCcw, MessageSquare, Send, PackageCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useTdc, type PortfolioItem, type ServiceItem, type CaseItem, type InquiryItem, type SavedFile } from "../store";
import { t, UI, CATEGORIES, fmtToman, fmtDate, fmtBytes } from "../i18n";
import { FileDrop } from "../FileDrop";
import { CaseDetailDialog, parseSafe } from "./CaseDetail";
import { toast } from "sonner";

/* ================= Admin Panel (full-screen overlay) ================= */

export function AdminPanel() {
  const { lang, overlay, closeOverlay, refreshSite } = useTdc();
  const open = overlay?.type === "admin";
  const initialTab = overlay?.type === "admin" ? (overlay as { tab?: string }).tab ?? "dashboard" : "dashboard";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-[#0a0c0f]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#101318] px-4 py-3 sm:px-6">
        <h1 className="flex items-center gap-2 text-base font-extrabold text-white sm:text-lg">
          <LayoutDashboard className="h-5 w-5 text-orange-400" />
          {t(UI.admin.title, lang)}
        </h1>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full border-white/15 text-white"
            onClick={async () => {
              await refreshSite();
              toast.success(lang === "fa" ? "سایت به‌روزرسانی شد" : "Site refreshed");
            }}
          >
            <RefreshCcw className="me-1 h-3.5 w-3.5" />
            {lang === "fa" ? "بازخوانی سایت" : "Sync site"}
          </Button>
          <Button size="icon" variant="ghost" className="text-white/60 hover:text-white" onClick={closeOverlay} aria-label={t(UI.common.close, lang)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue={initialTab} className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-4 mt-3 flex w-fit max-w-full gap-1 overflow-x-auto rounded-2xl bg-white/5 p-1 sm:mx-6">
          {[
            { key: "dashboard", label: UI.admin.dashboard, icon: LayoutDashboard },
            { key: "cases", label: UI.admin.cases, icon: FolderKanban },
            { key: "portfolio", label: UI.admin.portfolio, icon: Images },
            { key: "services", label: UI.admin.services, icon: Tags },
            { key: "inquiries", label: UI.admin.inquiries, icon: Inbox },
            { key: "texts", label: UI.admin.texts, icon: Type },
            { key: "subscribers", label: UI.admin.subscribers, icon: Users },
          ].map((tab) => (
            <TabsTrigger
              key={tab.key}
              value={tab.key}
              className="shrink-0 gap-1.5 whitespace-nowrap rounded-xl px-3 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-300"
            >
              <tab.icon className="h-4 w-4" />
              {t(tab.label, lang)}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="min-h-0 flex-1 overflow-y-auto thin-scroll p-4 sm:p-6">
          <TabsContent value="dashboard"><AdminDashboard /></TabsContent>
          <TabsContent value="cases"><AdminCases /></TabsContent>
          <TabsContent value="portfolio"><AdminPortfolio /></TabsContent>
          <TabsContent value="services"><AdminServices /></TabsContent>
          <TabsContent value="inquiries"><AdminInquiries /></TabsContent>
          <TabsContent value="texts"><AdminTexts /></TabsContent>
          <TabsContent value="subscribers"><AdminSubscribers /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

/* ---------- Dashboard ---------- */
function AdminDashboard() {
  const [stats, setStats] = useState<{ totalCases: number; byStatus: Record<string, number>; unreadInquiries: number; subscribers: number; portfolioItems: number; labs: number } | null>(null);
  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then((d) => setStats(d.stats)).catch(() => null);
  }, []);
  if (!stats) return <Spinner />;
  const cards = [
    { label: "کل کیس‌ها", en: "Total cases", value: stats.totalCases, cls: "text-orange-400" },
    { label: "در صف", en: "Received", value: stats.byStatus.RECEIVED, cls: "text-amber-400" },
    { label: "در حال طراحی", en: "In design", value: stats.byStatus.IN_DESIGN, cls: "text-orange-300" },
    { label: "تحویل‌شده", en: "Delivered", value: stats.byStatus.DELIVERED, cls: "text-emerald-400" },
    { label: "لابراتوارها", en: "Labs", value: stats.labs, cls: "text-teal-300" },
    { label: "استعلام خوانده‌نشده", en: "Unread inquiries", value: stats.unreadInquiries, cls: "text-red-400" },
    { label: "مشترکین", en: "Subscribers", value: stats.subscribers, cls: "text-white" },
    { label: "نمونه‌کارها", en: "Portfolio items", value: stats.portfolioItems, cls: "text-white" },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.en} className="rounded-2xl border border-white/10 bg-card p-5">
          <p className="text-xs text-white/45">{c.label}</p>
          <p className={`mt-1 text-3xl font-black tabular-nums ${c.cls}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}

/* ---------- Cases ---------- */
const STATUSES = ["RECEIVED", "IN_DESIGN", "QC", "DELIVERED", "CANCELLED"] as const;

function AdminCases() {
  const { lang } = useTdc();
  const [cases, setCases] = useState<CaseItem[] | null>(null);
  const [openCase, setOpenCase] = useState<CaseItem | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/cases").then((r) => r.json()).then((d) => setCases(d.cases ?? [])).catch(() => setCases([]));
  }, []);
  useEffect(load, [load]);

  if (!cases) return <Spinner />;
  if (cases.length === 0) return <Empty label={lang === "fa" ? "هنوز کیسی ثبت نشده" : "No cases yet"} />;

  return (
    <div className="space-y-3">
      {cases.map((c) => (
        <CaseRow key={c.id} c={c} onChanged={load} onOpen={() => setOpenCase(c)} />
      ))}
      <CaseDetailDialog kase={openCase} onClose={() => setOpenCase(null)} onChanged={load} isAdmin />
    </div>
  );
}

function CaseRow({ c, onChanged, onOpen }: { c: CaseItem; onChanged: () => void; onOpen: () => void }) {
  const { lang } = useTdc();
  const [saving, setSaving] = useState(false);
  const statusColor: Record<string, string> = {
    RECEIVED: "bg-amber-500/15 text-amber-300",
    IN_DESIGN: "bg-orange-500/15 text-orange-300",
    QC: "bg-teal-500/15 text-teal-300",
    DELIVERED: "bg-emerald-500/15 text-emerald-300",
    CANCELLED: "bg-red-500/15 text-red-300",
  };
  const setStatus = async (status: string) => {
    setSaving(true);
    await fetch(`/api/admin/cases/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setSaving(false);
    onChanged();
    toast.success(t(UI.admin.saved, lang));
  };
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-card p-4">
      <span className="font-display rounded-lg bg-orange-500/10 px-3 py-1.5 text-sm font-bold text-orange-300" dir="ltr">{c.code}</span>
      <div className="min-w-40 flex-1">
        <p className="text-sm font-bold text-white">{c.user?.labName || c.user?.name}</p>
        <p className="text-xs text-white/45" dir="ltr">{c.user?.email}</p>
      </div>
      <p className="text-xs text-white/50">{CATEGORIES[c.serviceType] ? (lang === "fa" ? CATEGORIES[c.serviceType].fa : CATEGORIES[c.serviceType].en) : c.serviceType}</p>
      <p className="text-[11px] text-white/35">{fmtDate(c.createdAt, lang)}</p>
      <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusColor[c.status]}`}>
        {t(UI.status[c.status], lang)}
      </span>
      <Select value={c.status} onValueChange={setStatus}>
        <SelectTrigger className="w-36 rounded-xl border-white/15 bg-white/5 text-white" aria-label="status">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <SelectValue />}
        </SelectTrigger>
        <SelectContent className="border-white/10 bg-[#161a21] text-white">
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>{t(UI.status[s], lang)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" variant="outline" className="rounded-full border-white/15 text-white" onClick={onOpen}>
        <MessageSquare className="me-1 h-3.5 w-3.5" />
        {lang === "fa" ? "جزئیات" : "Details"}
      </Button>
    </div>
  );
}


/* ---------- Portfolio ---------- */
const EMPTY_ITEM = {
  title: "", titleEn: "", description: "", descriptionEn: "",
  category: "CROWN_BRIDGE", badge: "", published: true,
  images: [] as SavedFile[], files: [] as SavedFile[],
};

function AdminPortfolio() {
  const { lang, refreshSite } = useTdc();
  const [items, setItems] = useState<PortfolioItem[] | null>(null);
  const [editing, setEditing] = useState<typeof EMPTY_ITEM & { id?: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch("/api/admin/portfolio").then((r) => r.json()).then((d) => setItems(d.items ?? []));
  }, []);
  useEffect(load, [load]);

  const save = async () => {
    if (!editing) return;
    if (!editing.title || !editing.description) {
      return toast.error(lang === "fa" ? "عنوان و توضیح فارسی الزامی است" : "Persian title & description required");
    }
    setBusy(true);
    const payload = { ...editing, id: undefined, ...{ id: editing.id } };
    const res = await fetch(editing.id ? `/api/admin/portfolio/${editing.id}` : "/api/admin/portfolio", {
      method: editing.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (res.ok) {
      toast.success(t(UI.admin.saved, lang));
      setEditing(null);
      load();
      refreshSite();
    } else toast.error(t(UI.common.error, lang));
  };

  const remove = async (id: string) => {
    if (!confirm(t(UI.admin.confirmDelete, lang))) return;
    await fetch(`/api/admin/portfolio/${id}`, { method: "DELETE" });
    load();
    refreshSite();
    toast.success(t(UI.admin.saved, lang));
  };

  const togglePublished = async (item: PortfolioItem) => {
    await fetch(`/api/admin/portfolio/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !item.published }),
    });
    load();
    refreshSite();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-white">{lang === "fa" ? "نمونه‌کارها" : "Portfolio items"}</h2>
        <Button onClick={() => setEditing({ ...EMPTY_ITEM })} className="rounded-full bg-orange-500 font-bold text-white hover:bg-orange-400">
          <Plus className="me-1 h-4 w-4" />
          {t(UI.admin.add, lang)}
        </Button>
      </div>

      {!items ? <Spinner /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => {
            const imgs = parseSafe(item.images);
            return (
              <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-card p-3">
                <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-black/40">
                  {imgs[0] && (
                    <img src={imgs[0]} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{item.title}</p>
                  <p className="truncate text-xs text-white/40" dir="ltr">{item.titleEn}</p>
                  <p className="mt-1 text-[10px] text-white/35">
                    {CATEGORIES[item.category]?.fa} · {parseSafe(item.files).length} فایل · ↓{item.downloads}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <Switch checked={item.published} onCheckedChange={() => togglePublished(item)} aria-label="publish" />
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-white/50 hover:text-orange-400" onClick={() => setEditing({
                      id: item.id,
                      title: item.title,
                      titleEn: item.titleEn ?? "",
                      description: item.description,
                      descriptionEn: item.descriptionEn ?? "",
                      category: item.category,
                      badge: item.badge ?? "",
                      published: item.published,
                      images: parseSafe(item.images),
                      files: parseSafe(item.files),
                    })}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-white/50 hover:text-red-400" onClick={() => remove(item.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editor dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto thin-scroll border-white/10 bg-[#101318] text-white sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-extrabold">
              {editing?.id ? t(UI.admin.edit, lang) : t(UI.admin.add, lang)} — {lang === "fa" ? "نمونه‌کار" : "Portfolio item"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-white/70">عنوان (فارسی) *</Label>
                  <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="mt-1.5 rounded-xl border-white/15 bg-white/5 text-white" />
                </div>
                <div>
                  <Label className="text-white/70">Title (English)</Label>
                  <Input dir="ltr" value={editing.titleEn} onChange={(e) => setEditing({ ...editing, titleEn: e.target.value })} className="mt-1.5 rounded-xl border-white/15 bg-white/5 text-white" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-white/70">توضیح (فارسی) *</Label>
                  <Textarea rows={2} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="mt-1.5 rounded-xl border-white/15 bg-white/5 text-white" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-white/70">Description (English)</Label>
                  <Textarea rows={2} dir="ltr" value={editing.descriptionEn} onChange={(e) => setEditing({ ...editing, descriptionEn: e.target.value })} className="mt-1.5 rounded-xl border-white/15 bg-white/5 text-white" />
                </div>
                <div>
                  <Label className="text-white/70">دسته‌بندی</Label>
                  <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v })}>
                    <SelectTrigger className="mt-1.5 rounded-xl border-white/15 bg-white/5 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="border-white/10 bg-[#161a21] text-white">
                      {Object.entries(CATEGORIES).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.fa} / {v.en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white/70">برچسب (Badge)</Label>
                  <Input value={editing.badge} onChange={(e) => setEditing({ ...editing, badge: e.target.value })} className="mt-1.5 rounded-xl border-white/15 bg-white/5 text-white" placeholder="زیرکونیا / ایمپلنت / DSD" />
                </div>
              </div>

              <div>
                <Label className="text-white/70">عکس‌های نمونه‌کار</Label>
                <div className="mt-1.5">
                  <FileDrop kind="portfolio-image" value={editing.images} onChange={(files) => setEditing({ ...editing, images: files })} accept="image/*" />
                </div>
              </div>
              <div>
                <Label className="text-white/70">فایل‌های قابل دانلود (STL، PDF، ZIP…)</Label>
                <div className="mt-1.5">
                  <FileDrop kind="portfolio-file" value={editing.files} onChange={(files) => setEditing({ ...editing, files })} />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <span className="text-sm font-semibold text-white/80">انتشار در سایت</span>
                <Switch checked={editing.published} onCheckedChange={(v) => setEditing({ ...editing, published: v })} />
              </div>

              <Button onClick={save} disabled={busy} className="w-full rounded-full bg-gradient-to-l from-orange-600 to-orange-500 py-3 font-bold text-white">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="me-1 h-4 w-4" />}
                {t(UI.admin.save, lang)}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- Services ---------- */
function AdminServices() {
  const { lang, refreshSite } = useTdc();
  const [services, setServices] = useState<ServiceItem[] | null>(null);
  const load = useCallback(() => {
    fetch("/api/admin/services").then((r) => r.json()).then((d) => setServices(d.services ?? []));
  }, []);
  useEffect(load, [load]);

  const update = async (id: string, data: Partial<ServiceItem>) => {
    await fetch(`/api/admin/services/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    load();
    refreshSite();
  };

  const remove = async (id: string) => {
    if (!confirm(t(UI.admin.confirmDelete, lang))) return;
    await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    load();
    refreshSite();
  };

  const add = async () => {
    await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "CROWN_BRIDGE", name: "خدمت جدید", nameEn: "New service", price: 1000000, unit: "/unit", turnaround: "۱ تا ۲ ساعت" }),
    });
    load();
    refreshSite();
  };

  if (!services) return <Spinner />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-white">{lang === "fa" ? "خدمات و تعرفه (تومان)" : "Services & pricing (Toman)"}</h2>
        <Button onClick={add} className="rounded-full bg-orange-500 font-bold text-white hover:bg-orange-400">
          <Plus className="me-1 h-4 w-4" />
          {t(UI.admin.add, lang)}
        </Button>
      </div>
      <div className="space-y-2">
        {services.map((sv) => (
          <div key={sv.id} className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-card p-3">
            <Input
              value={sv.name}
              onChange={(e) => setServices(services.map((x) => x.id === sv.id ? { ...x, name: e.target.value } : x))}
              onBlur={(e) => update(sv.id, { name: e.target.value })}
              className="w-44 rounded-xl border-white/15 bg-white/5 text-sm text-white"
              aria-label="name fa"
            />
            <Input
              dir="ltr"
              value={sv.nameEn}
              onChange={(e) => setServices(services.map((x) => x.id === sv.id ? { ...x, nameEn: e.target.value } : x))}
              onBlur={(e) => update(sv.id, { nameEn: e.target.value })}
              className="w-40 rounded-xl border-white/15 bg-white/5 text-sm text-white"
              aria-label="name en"
            />
            <Select value={sv.category} onValueChange={(v) => update(sv.id, { category: v })}>
              <SelectTrigger className="w-40 rounded-xl border-white/15 bg-white/5 text-xs text-white"><SelectValue /></SelectTrigger>
              <SelectContent className="border-white/10 bg-[#161a21] text-white">
                {Object.entries(CATEGORIES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.fa}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                dir="ltr"
                value={sv.price}
                onChange={(e) => setServices(services.map((x) => x.id === sv.id ? { ...x, price: Number(e.target.value) } : x))}
                onBlur={(e) => update(sv.id, { price: Number(e.target.value) })}
                className="w-32 rounded-xl border-white/15 bg-white/5 text-sm text-orange-300 tabular-nums"
                aria-label="price"
              />
              <Select value={sv.unit} onValueChange={(v) => update(sv.id, { unit: v })}>
                <SelectTrigger className="w-24 rounded-xl border-white/15 bg-white/5 text-xs text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="border-white/10 bg-[#161a21] text-white">
                  <SelectItem value="/unit">/unit</SelectItem>
                  <SelectItem value="/arch">/arch</SelectItem>
                  <SelectItem value="/case">/case</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              value={sv.turnaround}
              onChange={(e) => setServices(services.map((x) => x.id === sv.id ? { ...x, turnaround: e.target.value } : x))}
              onBlur={(e) => update(sv.id, { turnaround: e.target.value })}
              className="w-28 rounded-xl border-white/15 bg-white/5 text-xs text-white"
              aria-label="turnaround"
            />
            <Switch checked={sv.active} onCheckedChange={(v) => update(sv.id, { active: v })} aria-label="active" />
            <Button size="icon" variant="ghost" className="h-7 w-7 text-white/40 hover:text-red-400" onClick={() => remove(sv.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Inquiries ---------- */
function AdminInquiries() {
  const { lang } = useTdc();
  const [items, setItems] = useState<InquiryItem[] | null>(null);
  const load = useCallback(() => {
    fetch("/api/admin/inquiries").then((r) => r.json()).then((d) => setItems(d.inquiries ?? []));
  }, []);
  useEffect(load, [load]);
  if (!items) return <Spinner />;
  if (items.length === 0) return <Empty label={lang === "fa" ? "استعلامی نیست" : "No inquiries"} />;
  return (
    <div className="space-y-3">
      {items.map((q) => (
        <div key={q.id} className={`rounded-2xl border p-4 ${q.read ? "border-white/10 bg-card opacity-70" : "border-orange-500/40 bg-orange-500/[0.05]"}`}>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-white">{q.name}</p>
            <a href={`mailto:${q.email}`} className="text-xs text-orange-300" dir="ltr">{q.email}</a>
            {q.phone && <span className="text-xs text-white/40 tabular-nums" dir="ltr">{q.phone}</span>}
            <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] text-white/50">{t(UI.contact.topics[q.topic as keyof typeof UI.contact.topics] ?? UI.contact.topics.OTHER, lang)}</span>
            <span className="text-[10px] text-white/30">{fmtDate(q.createdAt, lang)}</span>
            <div className="ms-auto flex gap-1">
              {!q.read && (
                <Button size="sm" variant="outline" className="h-7 rounded-full border-white/15 text-xs text-white" onClick={async () => {
                  await fetch(`/api/admin/inquiries/${q.id}`, { method: "PATCH" });
                  load();
                }}>
                  {lang === "fa" ? "خوانده شد" : "Mark read"}
                </Button>
              )}
              <Button size="icon" variant="ghost" className="h-7 w-7 text-white/40 hover:text-red-400" onClick={async () => {
                if (!confirm(t(UI.admin.confirmDelete, lang))) return;
                await fetch(`/api/admin/inquiries/${q.id}`, { method: "DELETE" });
                load();
              }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <p className="mt-2 whitespace-pre-line text-sm leading-7 text-white/70">{q.message}</p>
        </div>
      ))}
    </div>
  );
}

/* ---------- Subscribers ---------- */
function AdminSubscribers() {
  const { lang } = useTdc();
  const [items, setItems] = useState<{ id: string; email: string; createdAt: string }[] | null>(null);
  useEffect(() => {
    fetch("/api/admin/subscribers").then((r) => r.json()).then((d) => setItems(d.subscribers ?? []));
  }, []);
  if (!items) return <Spinner />;
  if (items.length === 0) return <Empty label={lang === "fa" ? "مشترکی نیست" : "No subscribers"} />;
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-extrabold text-white">{lang === "fa" ? "مشترکین کارتعرفه" : "Rate-card subscribers"}</h2>
      {items.map((s) => (
        <div key={s.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-card px-4 py-3">
          <span className="text-sm text-white/80" dir="ltr">{s.email}</span>
          <span className="text-xs text-white/35">{fmtDate(s.createdAt, lang)}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Site texts editor ---------- */
interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "textarea" | "switch";
  bilingual?: boolean;
}

const TEXT_GROUPS: { title: string; fields: FieldDef[] }[] = [
  {
    title: "عمومی و اعلان",
    fields: [
      { key: "siteNameFull", label: "نام کامل برند" },
      { key: "tagline", label: "شعار", bilingual: true },
      { key: "announcement", label: "متن نوار اعلان", bilingual: true },
      { key: "announcementActive", label: "نوار اعلان فعال باشد", type: "switch" },
    ],
  },
  {
    title: "هیرو (بالای صفحه)",
    fields: [
      { key: "heroBadge", label: "برچسب بالای تیتر", bilingual: true },
      { key: "heroTitle", label: "تیتر اصلی", bilingual: true },
      { key: "heroSubtitle", label: "زیرتیتر", bilingual: true, type: "textarea" },
      { key: "heroFormats", label: "فرمت‌ها" },
      { key: "heroSoftware", label: "نرم‌افزارها" },
    ],
  },
  {
    title: "چه کسی طراحی می‌کند / مقایسه",
    fields: [
      { key: "whoDesigns", label: "متن بخش", bilingual: true, type: "textarea" },
      { key: "compareLeft", label: "لیست تامین‌کننده معمولی (هر خط یک مورد)" },
      { key: "compareRight", label: "لیست TDC (هر خط یک مورد)" },
    ],
  },
  {
    title: "تعرفه‌ها",
    fields: [
      { key: "pricingTitle", label: "تیتر", bilingual: true },
      { key: "pricingSubtitle", label: "زیرتیتر", bilingual: true },
      { key: "pricingVolumeNote", label: "یادداشت حجمی", bilingual: true, type: "textarea" },
    ],
  },
  {
    title: "تماس",
    fields: [
      { key: "phone1", label: "تلفن ۱" },
      { key: "phone2", label: "تلفن ۲" },
      { key: "email", label: "ایمیل" },
      { key: "instagram", label: "اینستاگرام (URL)" },
      { key: "telegram", label: "تلگرام (URL)" },
      { key: "address", label: "آدرس", bilingual: true },
      { key: "workingHours", label: "ساعات کاری", bilingual: true },
      { key: "talkTitle", label: "تیتر بخش تماس", bilingual: true },
      { key: "talkSubtitle", label: "زیرتیتر تماس", bilingual: true },
    ],
  },
  {
    title: "فوتر و قوانین",
    fields: [
      { key: "footerAbout", label: "متن فوتر", bilingual: true, type: "textarea" },
      { key: "terms", label: "شرایط خدمات", bilingual: true, type: "textarea" },
      { key: "privacy", label: "حریم خصوصی", bilingual: true, type: "textarea" },
      { key: "refund", label: "اصلاحات و بازگشت وجه", bilingual: true, type: "textarea" },
    ],
  },
];

function AdminTexts() {
  const { lang, site, refreshSite } = useTdc();
  const [values, setValues] = useState<Record<string, string>>(() =>
    site?.settings ? { ...site.settings } : {}
  );
  const [saving, setSaving] = useState(false);
  const [faqItems, setFaqItems] = useState<{ qFa: string; qEn: string; aFa: string; aEn: string }[]>(() => {
    try { return JSON.parse(site?.settings.faq || "[]"); } catch { return []; }
  });
  const [processItems, setProcessItems] = useState<{ step: string; titleFa: string; titleEn: string; descFa: string; descEn: string }[]>(() => {
    try { return JSON.parse(site?.settings.process || "[]"); } catch { return []; }
  });

  // Re-sync when the site data object changes (e.g. after save & refreshSite)
  const [syncedSite, setSyncedSite] = useState(site);
  if (site && site !== syncedSite) {
    setSyncedSite(site);
    setValues({ ...site.settings });
    try { setFaqItems(JSON.parse(site.settings.faq || "[]")); } catch { /* keep */ }
    try { setProcessItems(JSON.parse(site.settings.process || "[]")); } catch { /* keep */ }
  }

  const save = async () => {
    setSaving(true);
    const payload: Record<string, string> = { ...values, faq: JSON.stringify(faqItems), process: JSON.stringify(processItems) };
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      await refreshSite();
      toast.success(t(UI.admin.saved, lang));
    } else toast.error(t(UI.common.error, lang));
  };

  const set = (k: string, v: string) => setValues((p) => ({ ...p, [k]: v }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between bg-[#0a0c0f]/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl">
        <h2 className="text-lg font-extrabold text-white">{lang === "fa" ? "متون سایت" : "Site texts"}</h2>
        <Button onClick={save} disabled={saving} className="rounded-full bg-gradient-to-l from-orange-600 to-orange-500 font-bold text-white">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="me-1 h-4 w-4" />}
          {t(UI.admin.save, lang)}
        </Button>
      </div>

      {TEXT_GROUPS.map((group) => (
        <fieldset key={group.title} className="rounded-2xl border border-white/10 bg-card p-5">
          <legend className="px-2 text-sm font-extrabold text-orange-400">{group.title}</legend>
          <div className="space-y-4">
            {group.fields.map((f) => (
              <SettingField key={f.key} def={f} values={values} set={set} />
            ))}
          </div>
        </fieldset>
      ))}

      {/* Stats editor */}
      <fieldset className="rounded-2xl border border-white/10 bg-card p-5">
        <legend className="px-2 text-sm font-extrabold text-orange-400">آمار هیرو (۳ مورد)</legend>
        <HeroStatsEditor values={values} set={set} />
      </fieldset>

      {/* Process editor */}
      <fieldset className="rounded-2xl border border-white/10 bg-card p-5">
        <legend className="px-2 text-sm font-extrabold text-orange-400">مراحل کار</legend>
        <div className="space-y-3">
          {processItems.map((p, i) => (
            <div key={i} className="grid gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:grid-cols-5">
              <Input value={p.step} onChange={(e) => setProcessItems(processItems.map((x, xi) => xi === i ? { ...x, step: e.target.value } : x))} className="rounded-lg border-white/15 bg-white/5 text-sm text-white" placeholder="01" aria-label="step" />
              <Input value={p.titleFa} onChange={(e) => setProcessItems(processItems.map((x, xi) => xi === i ? { ...x, titleFa: e.target.value } : x))} className="rounded-lg border-white/15 bg-white/5 text-sm text-white" placeholder="عنوان فا" aria-label="title fa" />
              <Input value={p.titleEn} onChange={(e) => setProcessItems(processItems.map((x, xi) => xi === i ? { ...x, titleEn: e.target.value } : x))} className="rounded-lg border-white/15 bg-white/5 text-sm text-white" placeholder="Title en" dir="ltr" aria-label="title en" />
              <Input value={p.descFa} onChange={(e) => setProcessItems(processItems.map((x, xi) => xi === i ? { ...x, descFa: e.target.value } : x))} className="rounded-lg border-white/15 bg-white/5 text-sm text-white sm:col-span-2" placeholder="توضیح فا" aria-label="desc fa" />
              <Input value={p.descEn} onChange={(e) => setProcessItems(processItems.map((x, xi) => xi === i ? { ...x, descEn: e.target.value } : x))} className="rounded-lg border-white/15 bg-white/5 text-sm text-white sm:col-span-4" placeholder="Desc en" dir="ltr" aria-label="desc en" />
              <Button size="icon" variant="ghost" className="mx-auto text-white/40 hover:text-red-400" onClick={() => setProcessItems(processItems.filter((_, xi) => xi !== i))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button size="sm" variant="outline" className="rounded-full border-white/15 text-white" onClick={() => setProcessItems([...processItems, { step: String(processItems.length + 1).padStart(2, "0"), titleFa: "", titleEn: "", descFa: "", descEn: "" }])}>
            <Plus className="me-1 h-3.5 w-3.5" /> مرحله
          </Button>
        </div>
      </fieldset>

      {/* FAQ editor */}
      <fieldset className="rounded-2xl border border-white/10 bg-card p-5">
        <legend className="px-2 text-sm font-extrabold text-orange-400">سوالات متداول</legend>
        <div className="space-y-3">
          {faqItems.map((q, i) => (
            <div key={i} className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <Input value={q.qFa} onChange={(e) => setFaqItems(faqItems.map((x, xi) => xi === i ? { ...x, qFa: e.target.value } : x))} className="rounded-lg border-white/15 bg-white/5 text-sm text-white" placeholder="سوال (فا)" aria-label="q fa" />
                <Input value={q.qEn} onChange={(e) => setFaqItems(faqItems.map((x, xi) => xi === i ? { ...x, qEn: e.target.value } : x))} className="rounded-lg border-white/15 bg-white/5 text-sm text-white" placeholder="Q (en)" dir="ltr" aria-label="q en" />
                <Textarea rows={2} value={q.aFa} onChange={(e) => setFaqItems(faqItems.map((x, xi) => xi === i ? { ...x, aFa: e.target.value } : x))} className="rounded-lg border-white/15 bg-white/5 text-sm text-white" placeholder="جواب (فا)" aria-label="a fa" />
                <Textarea rows={2} value={q.aEn} onChange={(e) => setFaqItems(faqItems.map((x, xi) => xi === i ? { ...x, aEn: e.target.value } : x))} className="rounded-lg border-white/15 bg-white/5 text-sm text-white" placeholder="A (en)" dir="ltr" aria-label="a en" />
              </div>
              <Button size="sm" variant="ghost" className="text-white/40 hover:text-red-400" onClick={() => setFaqItems(faqItems.filter((_, xi) => xi !== i))}>
                <Trash2 className="me-1 h-3.5 w-3.5" /> حذف
              </Button>
            </div>
          ))}
          <Button size="sm" variant="outline" className="rounded-full border-white/15 text-white" onClick={() => setFaqItems([...faqItems, { qFa: "", qEn: "", aFa: "", aEn: "" }])}>
            <Plus className="me-1 h-3.5 w-3.5" /> سوال
          </Button>
        </div>
      </fieldset>

      <Button onClick={save} disabled={saving} className="w-full rounded-full bg-gradient-to-l from-orange-600 to-orange-500 py-3 font-bold text-white">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="me-1 h-4 w-4" />}
        {t(UI.admin.save, lang)}
      </Button>
    </div>
  );
}

function SettingField({ def, values, set }: { def: FieldDef; values: Record<string, string>; set: (k: string, v: string) => void }) {
  if (def.type === "switch") {
    return (
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <span className="text-sm font-semibold text-white/80">{def.label}</span>
        <Switch checked={values[def.key] !== "false"} onCheckedChange={(v) => set(def.key, String(v))} />
      </div>
    );
  }
  if (def.bilingual) {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <Label className="text-white/55">{def.label} (فا)</Label>
          {def.type === "textarea" ? (
            <Textarea rows={3} value={values[`${def.key}Fa`] ?? ""} onChange={(e) => set(`${def.key}Fa`, e.target.value)} className="mt-1.5 rounded-xl border-white/15 bg-white/5 text-sm text-white" />
          ) : (
            <Input value={values[`${def.key}Fa`] ?? ""} onChange={(e) => set(`${def.key}Fa`, e.target.value)} className="mt-1.5 rounded-xl border-white/15 bg-white/5 text-sm text-white" />
          )}
        </div>
        <div>
          <Label className="text-white/55">{def.label} (EN)</Label>
          {def.type === "textarea" ? (
            <Textarea rows={3} dir="ltr" value={values[`${def.key}En`] ?? ""} onChange={(e) => set(`${def.key}En`, e.target.value)} className="mt-1.5 rounded-xl border-white/15 bg-white/5 text-sm text-white" />
          ) : (
            <Input dir="ltr" value={values[`${def.key}En`] ?? ""} onChange={(e) => set(`${def.key}En`, e.target.value)} className="mt-1.5 rounded-xl border-white/15 bg-white/5 text-sm text-white" />
          )}
        </div>
      </div>
    );
  }
  return (
    <div>
      <Label className="text-white/55">{def.label}</Label>
      {def.type === "textarea" ? (
        <Textarea rows={4} value={values[def.key] ?? ""} onChange={(e) => set(def.key, e.target.value)} className="mt-1.5 rounded-xl border-white/15 bg-white/5 text-sm text-white" />
      ) : (
        <Input value={values[def.key] ?? ""} onChange={(e) => set(def.key, e.target.value)} className="mt-1.5 rounded-xl border-white/15 bg-white/5 text-sm text-white" dir={def.key.includes("phone") || def.key.includes("instagram") || def.key.includes("telegram") || def.key.includes("email") ? "ltr" : undefined} />
      )}
    </div>
  );
}

function HeroStatsEditor({ values, set }: { values: Record<string, string>; set: (k: string, v: string) => void }) {
  let stats: { value: string; valueEn: string; labelFa: string; labelEn: string }[] = [];
  try { stats = JSON.parse(values.heroStats || "[]"); } catch { stats = []; }
  const upd = (next: typeof stats) => set("heroStats", JSON.stringify(next));
  return (
    <div className="space-y-3">
      {stats.map((s, i) => (
        <div key={i} className="grid gap-2 sm:grid-cols-4">
          <Input value={s.value} onChange={(e) => { const n = [...stats]; n[i] = { ...s, value: e.target.value }; upd(n); }} className="rounded-lg border-white/15 bg-white/5 text-sm text-white" placeholder="۲ ساعت" aria-label="value fa" />
          <Input value={s.valueEn} onChange={(e) => { const n = [...stats]; n[i] = { ...s, valueEn: e.target.value }; upd(n); }} className="rounded-lg border-white/15 bg-white/5 text-sm text-white" placeholder="2h" dir="ltr" aria-label="value en" />
          <Input value={s.labelFa} onChange={(e) => { const n = [...stats]; n[i] = { ...s, labelFa: e.target.value }; upd(n); }} className="rounded-lg border-white/15 bg-white/5 text-sm text-white" placeholder="برچسب فا" aria-label="label fa" />
          <Input value={s.labelEn} onChange={(e) => { const n = [...stats]; n[i] = { ...s, labelEn: e.target.value }; upd(n); }} className="rounded-lg border-white/15 bg-white/5 text-sm text-white" placeholder="Label en" dir="ltr" aria-label="label en" />
        </div>
      ))}
    </div>
  );
}

/* ---------- shared bits ---------- */
function Spinner() {
  return (
    <div className="grid place-items-center py-20">
      <Loader2 className="h-7 w-7 animate-spin text-orange-400" />
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="py-16 text-center text-sm text-white/35">{label}</p>;
}
