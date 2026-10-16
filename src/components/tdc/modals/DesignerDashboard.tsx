"use client";

import { useCallback, useEffect, useState } from "react";
import {
  X, LogOut, RefreshCcw, Loader2, Play, Send, Save, Clock, AlertTriangle, Award, Lock,
  ListChecks, CheckCircle2, BarChart3, Palette, Star, Timer, RotateCcw, Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTdc, type DesignerStats, type SavedFile, type CaseEventItem } from "../store";
import { t, UI, CATEGORIES, fmtDate } from "../i18n";
import { FileDrop } from "../FileDrop";
import { FileRow, parseSafe } from "./CaseDetail";
import { EventTimeline, dueInfo, Stars, fmtHours } from "../case-events";
import { toast } from "sonner";

interface DCase {
  id: string;
  code: string;
  serviceType: string;
  patientName?: string | null;
  toothNumbers?: string | null;
  notes?: string | null;
  status: "RECEIVED" | "IN_DESIGN" | "QC" | "DELIVERED" | "CANCELLED";
  files: string;
  deliveryFiles: string;
  designerNote?: string | null;
  assignedAt?: string | null;
  dueAt?: string | null;
  submittedAt?: string | null;
  deliveredAt?: string | null;
  revisionCount: number;
  rating?: number | null;
  ratingComment?: string | null;
  score?: number | null;
  scoreNote?: string | null;
  createdAt: string;
  updatedAt: string;
  events?: CaseEventItem[];
}

const STATUS_COLOR: Record<string, string> = {
  RECEIVED: "bg-amber-500/15 text-amber-300",
  IN_DESIGN: "bg-orange-500/15 text-orange-300",
  QC: "bg-teal-500/15 text-teal-300",
  DELIVERED: "bg-emerald-500/15 text-emerald-300",
  CANCELLED: "bg-red-500/15 text-red-300",
};

const ERRORS: Record<string, { fa: string; en: string }> = {
  INVALID_STATE: { fa: "در وضعیت فعلی این کار ممکن نیست.", en: "Not possible in the current state." },
  NO_DELIVERY_FILES: { fa: "اول فایل نهایی را آپلود کنید یا لینک آن را اضافه کنید.", en: "Upload the final file (or add a link) first." },
  NOTE_REQUIRED: { fa: "متن یادداشت را بنویسید.", en: "Please write the note." },
};

const nf = (lang: string) => new Intl.NumberFormat(lang === "fa" ? "fa-IR" : "en-US", { maximumFractionDigits: 1 });

/* ====================== Dashboard ====================== */
export function DesignerDashboard() {
  const { lang, overlay, closeOverlay, user, logout } = useTdc();
  const open = overlay?.type === "designer";
  const fa = lang === "fa";
  const [tab, setTab] = useState("active");
  const [data, setData] = useState<{ cases: DCase[]; stats: DesignerStats } | null>(null);
  const [failed, setFailed] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/designer/cases");
      if (!res.ok) throw new Error("load");
      setData(await res.json());
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setTab("active");
      load();
    }
  }, [open, load]);

  // keep the list fresh while the panel stays open (new assignments, review results)
  useEffect(() => {
    if (!open) return;
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [open, load]);

  if (!open) return null;

  const cases = data?.cases ?? [];
  const stats = data?.stats;
  const active = cases
    .filter((c) => c.status === "RECEIVED" || c.status === "IN_DESIGN" || c.status === "QC")
    .sort((a, b) => {
      const da = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
      const db = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
      return da - db;
    });
  const done = cases
    .filter((c) => c.status === "DELIVERED")
    .sort((a, b) => new Date(b.deliveredAt ?? b.updatedAt).getTime() - new Date(a.deliveredAt ?? a.updatedAt).getTime());

  const cards: { label: string; value: string; cls: string; icon: typeof ListChecks }[] = stats
    ? [
        { label: fa ? "کارهای فعال" : "Open cases", value: nf(lang).format(stats.open), cls: "text-orange-300", icon: ListChecks },
        { label: fa ? "منتظر بازبینی" : "In review", value: nf(lang).format(stats.inReview), cls: "text-teal-300", icon: Clock },
        { label: fa ? "دیرکرد" : "Overdue", value: nf(lang).format(stats.overdue), cls: stats.overdue > 0 ? "text-red-400" : "text-white", icon: AlertTriangle },
        { label: fa ? "تحویل‌شده" : "Delivered", value: nf(lang).format(stats.delivered), cls: "text-emerald-300", icon: CheckCircle2 },
        { label: fa ? "میانگین امتیاز" : "Average score", value: stats.avgScore === null ? "—" : nf(lang).format(stats.avgScore), cls: "text-purple-300", icon: Award },
      ]
    : [];

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-[#0a0c0f]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#101318] px-4 py-3 sm:px-6">
        <div>
          <h1 className="flex items-center gap-2 text-base font-extrabold text-white sm:text-lg">
            <Palette className="h-5 w-5 text-sky-400" />
            {fa ? "داشبورد طراح" : "Designer dashboard"} — {user?.name}
          </h1>
          <p className="text-xs text-white/45" dir="ltr">@{user?.username}</p>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full border-white/15 text-white"
            onClick={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          >
            {refreshing ? <Loader2 className="me-1 h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="me-1 h-3.5 w-3.5" />}
            {fa ? "بازخوانی" : "Refresh"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-white/60 hover:text-white"
            onClick={async () => {
              closeOverlay();
              await logout();
            }}
          >
            <LogOut className="me-1 h-4 w-4" />
            <span className="hidden sm:inline">{fa ? "خروج" : "Sign out"}</span>
          </Button>
          <Button size="icon" variant="ghost" className="text-white/60 hover:text-white" onClick={closeOverlay} aria-label={t(UI.common.close, lang)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-4 mt-3 flex w-fit max-w-full gap-1 overflow-x-auto rounded-2xl bg-white/5 p-1 sm:mx-6">
          {[
            { key: "active", label: fa ? "کارهای من" : "My cases", icon: ListChecks, count: active.length },
            { key: "done", label: fa ? "تحویل‌شده‌ها" : "Delivered", icon: CheckCircle2, count: done.length },
            { key: "performance", label: fa ? "عملکرد من" : "My performance", icon: BarChart3, count: 0 },
          ].map((tb) => (
            <TabsTrigger
              key={tb.key}
              value={tb.key}
              className="shrink-0 gap-1.5 whitespace-nowrap rounded-xl px-4 data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-300"
            >
              <tb.icon className="h-4 w-4" />
              {tb.label}
              {tb.count > 0 && (
                <span className="rounded-full bg-white/10 px-1.5 text-[10px] tabular-nums">{nf(lang).format(tb.count)}</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="min-h-0 flex-1 overflow-y-auto thin-scroll p-4 sm:p-6">
          {failed && !data && (
            <div className="py-16 text-center">
              <p className="text-sm text-white/50">{fa ? "دریافت اطلاعات ناموفق بود." : "Could not load your cases."}</p>
              <Button className="mt-4 rounded-full bg-sky-500 font-bold text-white" onClick={load}>
                {fa ? "تلاش مجدد" : "Try again"}
              </Button>
            </div>
          )}
          {!data && !failed && (
            <div className="grid place-items-center py-20">
              <Loader2 className="h-7 w-7 animate-spin text-sky-400" />
            </div>
          )}

          {data && (
            <>
              <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
                {cards.map((c) => (
                  <div key={c.label} className="rounded-2xl border border-white/10 bg-card p-4">
                    <p className="flex items-center gap-1.5 text-[11px] text-white/45">
                      <c.icon className="h-3.5 w-3.5" />
                      {c.label}
                    </p>
                    <p className={`mt-1 text-2xl font-black tabular-nums ${c.cls}`}>{c.value}</p>
                  </div>
                ))}
              </div>

              <TabsContent value="active">
                <CaseList cases={active} empty={fa ? "فعلاً کاری به شما داده نشده است." : "No cases assigned to you right now."} onOpen={setSelectedId} />
              </TabsContent>
              <TabsContent value="done">
                <CaseList cases={done} empty={fa ? "هنوز کاری تحویل نداده‌اید." : "Nothing delivered yet."} onOpen={setSelectedId} showScore />
              </TabsContent>
              <TabsContent value="performance">
                <Performance stats={stats!} cases={cases} username={user?.username ?? ""} />
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>

      {selectedId && (
        <DesignerCaseDialog
          key={selectedId}
          id={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}

/* ====================== list ====================== */
function CaseList({
  cases, empty, onOpen, showScore = false,
}: {
  cases: DCase[];
  empty: string;
  onOpen: (id: string) => void;
  showScore?: boolean;
}) {
  const { lang } = useTdc();
  const fa = lang === "fa";
  if (cases.length === 0) return <p className="py-16 text-center text-sm text-white/35">{empty}</p>;
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {cases.map((c) => {
        const due = c.status === "DELIVERED" ? null : dueInfo(c.dueAt, lang);
        return (
          <button
            key={c.id}
            onClick={() => onOpen(c.id)}
            className="w-full rounded-2xl border border-white/10 bg-card p-4 text-start transition hover:border-sky-500/40"
          >
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-display rounded-lg bg-orange-500/10 px-3 py-1.5 text-sm font-bold text-orange-300" dir="ltr">{c.code}</span>
              <span className="text-sm text-white/75">
                {CATEGORIES[c.serviceType] ? (fa ? CATEGORIES[c.serviceType].fa : CATEGORIES[c.serviceType].en) : c.serviceType}
              </span>
              {c.toothNumbers && <span className="text-xs text-white/45">{fa ? "دندان" : "Teeth"}: {c.toothNumbers}</span>}
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_COLOR[c.status]}`}>{t(UI.status[c.status], lang)}</span>
              {c.status === "RECEIVED" && (
                <span className="rounded-full bg-sky-500/20 px-2.5 py-1 text-[10px] font-bold text-sky-300">{fa ? "جدید" : "New"}</span>
              )}
              {c.revisionCount > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-1 text-[10px] font-bold text-red-300">
                  <RotateCcw className="h-3 w-3" />
                  {fa ? "اصلاح" : "Rev."} {nf(lang).format(c.revisionCount)}
                </span>
              )}
              {due && (
                <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${due.overdue ? "bg-red-500/15 text-red-300" : "bg-sky-500/15 text-sky-300"}`}>
                  <Clock className="h-3 w-3" />
                  {due.text}
                </span>
              )}
              {showScore && c.score !== null && c.score !== undefined && (
                <span className="ms-auto flex items-center gap-1 rounded-full bg-purple-500/15 px-3 py-1 text-xs font-black text-purple-200 tabular-nums">
                  <Award className="h-3.5 w-3.5" />
                  {nf(lang).format(c.score)}
                </span>
              )}
            </div>
            {c.designerNote && c.status !== "DELIVERED" && (
              <p className="mt-2 line-clamp-1 text-xs text-white/45">📌 {c.designerNote}</p>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ====================== performance ====================== */
function Performance({ stats, cases, username }: { stats: DesignerStats; cases: DCase[]; username: string }) {
  const { lang } = useTdc();
  const fa = lang === "fa";
  const scored = cases.filter((c) => c.score !== null && c.score !== undefined).slice(0, 15);
  const items: { label: string; value: React.ReactNode; hint: string; icon: typeof Award }[] = [
    {
      label: fa ? "میانگین امتیاز مدیریت" : "Average admin score",
      value: stats.avgScore === null ? "—" : `${nf(lang).format(stats.avgScore)} / ${nf(lang).format(100)}`,
      hint: fa ? `از ${nf(lang).format(stats.scoredCount)} کار امتیازدهی‌شده` : `from ${stats.scoredCount} scored cases`,
      icon: Award,
    },
    {
      label: fa ? "رضایت لابراتوارها" : "Lab satisfaction",
      value: stats.avgRating === null ? "—" : <span className="inline-flex items-center gap-2">{nf(lang).format(stats.avgRating)} <Stars value={stats.avgRating} size={15} /></span>,
      hint: fa ? `از ${nf(lang).format(stats.ratedCount)} نظر` : `from ${stats.ratedCount} ratings`,
      icon: Star,
    },
    {
      label: fa ? "میانگین دفعات اصلاح" : "Average revisions",
      value: stats.avgRevisions === null ? "—" : nf(lang).format(stats.avgRevisions),
      hint: fa ? "برای هر کار (هرچه کمتر، بهتر)" : "per case (lower is better)",
      icon: RotateCcw,
    },
    {
      label: fa ? "تحویل به‌موقع" : "On-time delivery",
      value: stats.onTimeRate === null ? "—" : `${nf(lang).format(stats.onTimeRate)}٪`,
      hint: fa ? "از کارهای دارای مهلت" : "of cases that had a deadline",
      icon: Target,
    },
    {
      label: fa ? "میانگین زمان تحویل" : "Average turnaround",
      value: fmtHours(stats.avgTurnaroundHours, lang),
      hint: fa ? "از دریافت کار تا تحویل" : "from assignment to delivery",
      icon: Timer,
    },
  ];
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((it) => (
          <div key={it.label} className="rounded-2xl border border-white/10 bg-card p-4">
            <p className="flex items-center gap-1.5 text-xs text-white/50">
              <it.icon className="h-3.5 w-3.5 text-sky-400" />
              {it.label}
            </p>
            <p className="mt-1.5 text-2xl font-black tabular-nums text-white">{it.value}</p>
            <p className="mt-0.5 text-[11px] text-white/35">{it.hint}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-card p-4 text-xs leading-7 text-white/55">
        <p className="mb-1 text-sm font-bold text-white/80">{fa ? "امتیاز چطور محاسبه می‌شود؟" : "How is the score decided?"}</p>
        {fa
          ? "برای هر کار تحویل‌شده، مدیریت یک امتیاز از ۰ تا ۱۰۰ می‌دهد. مبنا: تعداد دفعاتی که کار برای اصلاح برگشته (هر بار حدود ۱۰ امتیاز کم می‌شود)، رضایت پزشک یا لابراتوار (۱ تا ۵ ستاره) و رعایت مهلت تحویل."
          : "For every delivered case the admin gives a score from 0 to 100, based on how many times the work was sent back for changes (about 10 points each), the satisfaction of the doctor or lab (1–5 stars) and whether the deadline was met."}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-extrabold text-white">{fa ? "آخرین امتیازها" : "Latest scores"}</h3>
        {scored.length === 0 ? (
          <p className="text-xs text-white/35">{fa ? "هنوز امتیازی ثبت نشده است." : "No scores yet."}</p>
        ) : (
          <div className="space-y-2">
            {scored.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-card px-4 py-3">
                <span className="font-display text-sm font-bold text-orange-300" dir="ltr">{c.code}</span>
                <span className="rounded-full bg-purple-500/15 px-3 py-0.5 text-xs font-black tabular-nums text-purple-200">{nf(lang).format(c.score ?? 0)}</span>
                {c.rating ? <Stars value={c.rating} size={12} /> : null}
                {c.revisionCount > 0 && <span className="text-[11px] text-red-300/80">{fa ? "اصلاح" : "rev."} {nf(lang).format(c.revisionCount)}</span>}
                {c.scoreNote && <span className="w-full text-xs text-white/50">💬 {c.scoreNote}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs leading-6 text-white/45">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          {fa
            ? `نام کاربری شما: @${username}. تغییر نام کاربری و رمز عبور فقط توسط مدیریت انجام می‌شود.`
            : `Your username is @${username}. Only the admin can change your username or password.`}
        </p>
      </div>
    </div>
  );
}

/* ====================== one case ====================== */
function DesignerCaseDialog({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const { lang } = useTdc();
  const fa = lang === "fa";
  const [c, setC] = useState<DCase | null>(null);
  const [delivery, setDelivery] = useState<SavedFile[]>([]);
  const [note, setNote] = useState("");
  const [submitNote, setSubmitNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/designer/cases/${id}`);
      if (!res.ok) return;
      const d = await res.json();
      setC(d.case);
      setDelivery(parseSafe(d.case.deliveryFiles));
    } catch {
      /* keep what we have */
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (action: string, extra: Record<string, unknown> = {}, okMsg?: string): Promise<boolean> => {
    setBusy(action);
    try {
      const res = await fetch(`/api/designer/cases/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const e = ERRORS[data.error];
        toast.error(e ? (fa ? e.fa : e.en) : fa ? "خطا در انجام کار" : "Action failed");
        return false;
      }
      toast.success(okMsg ?? (fa ? "انجام شد" : "Done"));
      await load();
      onChanged();
      return true;
    } finally {
      setBusy(null);
    }
  };

  const caseFiles = parseSafe(c?.files);
  const workable = c?.status === "RECEIVED" || c?.status === "IN_DESIGN";
  const due = c && c.status !== "DELIVERED" ? dueInfo(c.dueAt, lang) : null;
  const lastRevision = [...(c?.events ?? [])].reverse().find((e) => e.type === "REVISION");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto thin-scroll border-white/10 bg-[#101318] text-white sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 font-extrabold" dir="ltr">
            <span className="font-display text-orange-300">{c?.code ?? "…"}</span>
            {c && <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${STATUS_COLOR[c.status]}`}>{t(UI.status[c.status], lang)}</span>}
            {due && (
              <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${due.overdue ? "bg-red-500/15 text-red-300" : "bg-sky-500/15 text-sky-300"}`}>
                <Clock className="h-3 w-3" />
                {due.text}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {!c ? (
          <div className="grid place-items-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
          </div>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <Info label={fa ? "خدمت" : "Service"} value={CATEGORIES[c.serviceType] ? (fa ? CATEGORIES[c.serviceType].fa : CATEGORIES[c.serviceType].en) : c.serviceType} />
              <Info label={fa ? "دندان‌ها" : "Teeth"} value={c.toothNumbers || "—"} />
              <Info label={fa ? "بیمار" : "Patient"} value={c.patientName || "—"} />
              <Info label={fa ? "تاریخ دریافت" : "Assigned"} value={c.assignedAt ? fmtDate(c.assignedAt, lang) : "—"} />
              <div className="col-span-2">
                <Info label={fa ? "توضیحات لابراتوار" : "Lab notes"} value={c.notes || "—"} />
              </div>
            </div>

            {c.designerNote && (
              <div className="rounded-xl border border-sky-400/25 bg-sky-400/[0.06] p-3">
                <p className="text-[11px] font-bold text-sky-300">{fa ? "دستور کار مدیریت" : "Instructions from the admin"}</p>
                <p className="mt-1 whitespace-pre-line text-sm leading-7 text-white/80">{c.designerNote}</p>
              </div>
            )}

            {lastRevision && c.status === "IN_DESIGN" && (
              <div className="rounded-xl border border-red-400/30 bg-red-400/[0.07] p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-bold text-red-300">
                  <RotateCcw className="h-3.5 w-3.5" />
                  {fa ? "این کار برای اصلاح برگشته است" : "This case was sent back for changes"}
                </p>
                {lastRevision.note && <p className="mt-1 whitespace-pre-line text-sm leading-7 text-white/80">{lastRevision.note}</p>}
              </div>
            )}

            {caseFiles.length > 0 && (
              <div>
                <Label className="text-white/60">{fa ? "فایل‌های کیس" : "Case files"}</Label>
                <ul className="mt-2 space-y-1.5">
                  {caseFiles.map((f, i) => (
                    <li key={i}>
                      <FileRow f={f} lang={lang} tone="case" />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Work area */}
            {c.status === "RECEIVED" && (
              <Button
                disabled={busy !== null}
                onClick={() => act("START", {}, fa ? "کار شروع شد" : "Work started")}
                className="w-full rounded-full bg-sky-500 py-5 font-bold text-white hover:bg-sky-400"
              >
                {busy === "START" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="me-1 h-4 w-4" />}
                {fa ? "شروع کار روی این کیس" : "Start working on this case"}
              </Button>
            )}

            {workable && (
              <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <Label className="text-white/70">{fa ? "فایل نهایی طراحی (تحویل)" : "Final design files (delivery)"}</Label>
                <FileDrop kind="delivery-file" value={delivery} onChange={setDelivery} compact />
                <Input
                  value={submitNote}
                  onChange={(e) => setSubmitNote(e.target.value)}
                  placeholder={fa ? "توضیح برای مدیریت (اختیاری)" : "Note for the admin (optional)"}
                  className="rounded-xl border-white/15 bg-white/5 text-white placeholder:text-white/25"
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy !== null}
                    onClick={() => act("SAVE", { deliveryFiles: delivery }, fa ? "پیش‌نویس ذخیره شد" : "Draft saved")}
                    className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10"
                  >
                    {busy === "SAVE" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="me-1 h-3.5 w-3.5" />}
                    {fa ? "ذخیره پیش‌نویس" : "Save draft"}
                  </Button>
                  <Button
                    size="sm"
                    disabled={busy !== null || delivery.length === 0}
                    onClick={async () => {
                      const ok = await act("SUBMIT", { deliveryFiles: delivery, note: submitNote }, fa ? "برای بازبینی ارسال شد" : "Sent for review");
                      if (ok) setSubmitNote("");
                    }}
                    className="rounded-full bg-emerald-500 font-bold text-white hover:bg-emerald-400"
                  >
                    {busy === "SUBMIT" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="me-1 h-3.5 w-3.5" />}
                    {fa ? "ارسال برای بازبینی مدیریت" : "Send for review"}
                  </Button>
                </div>
              </div>
            )}

            {c.status === "QC" && (
              <div className="space-y-2 rounded-xl border border-teal-400/25 bg-teal-400/[0.05] p-4">
                <p className="text-xs font-bold text-teal-300">
                  {fa ? "کار شما برای بازبینی مدیریت ارسال شده و منتظر تأیید است." : "Your work was sent and is waiting for the admin's review."}
                </p>
                <ul className="space-y-1.5">
                  {parseSafe(c.deliveryFiles).map((f, i) => (
                    <li key={i}>
                      <FileRow f={f} lang={lang} tone="delivery" />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {c.status === "DELIVERED" && (
              <div className="space-y-2 rounded-xl border border-purple-400/25 bg-purple-400/[0.05] p-4">
                <p className="flex items-center gap-1.5 text-xs font-bold text-purple-200">
                  <Award className="h-4 w-4" />
                  {fa ? "نتیجه‌ی این کار" : "Result of this case"}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-sm text-white/75">
                  <span>
                    {fa ? "امتیاز مدیریت:" : "Admin score:"}{" "}
                    <b className="text-purple-200 tabular-nums">{c.score === null || c.score === undefined ? (fa ? "هنوز ثبت نشده" : "not scored yet") : nf(lang).format(c.score)}</b>
                  </span>
                  <span>{fa ? "اصلاحات:" : "Revisions:"} <b className="tabular-nums">{nf(lang).format(c.revisionCount)}</b></span>
                  {c.rating ? <Stars value={c.rating} /> : null}
                </div>
                {c.scoreNote && <p className="text-xs leading-6 text-white/60">💬 {c.scoreNote}</p>}
              </div>
            )}

            {/* Notes + log */}
            <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <Label className="text-white/60">{fa ? "تاریخچه و یادداشت‌ها" : "Activity & notes"}</Label>
              <div className="max-h-44 overflow-y-auto thin-scroll pe-1">
                <EventTimeline events={c.events ?? []} lang={lang} />
              </div>
              <div className="flex gap-2">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={1}
                  placeholder={fa ? "یادداشت یا سؤال برای مدیریت…" : "Note or question for the admin…"}
                  className="min-h-9 rounded-xl border-white/15 bg-white/5 text-sm text-white placeholder:text-white/25"
                />
                <Button
                  size="sm"
                  disabled={!note.trim() || busy !== null}
                  onClick={async () => {
                    const ok = await act("NOTE", { note }, fa ? "یادداشت ثبت شد" : "Note added");
                    if (ok) setNote("");
                  }}
                  className="shrink-0 rounded-xl bg-white/10 text-white hover:bg-white/15"
                >
                  {fa ? "ثبت" : "Add"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-white/40">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-white/85">{value}</p>
    </div>
  );
}
