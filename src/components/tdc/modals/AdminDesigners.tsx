"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Copy, KeyRound, ChevronDown, ChevronUp, Wand2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useTdc, type DesignerItem, type CaseItem } from "../store";
import { t, UI, CATEGORIES } from "../i18n";
import { Stars, fmtHours, dueInfo } from "../case-events";
import { toast } from "sonner";

const ERRORS: Record<string, { fa: string; en: string }> = {
  MISSING_FIELDS: { fa: "نام را وارد کنید.", en: "Please enter the name." },
  INVALID_USERNAME: {
    fa: "نام کاربری باید ۳ تا ۳۰ کاراکتر و فقط شامل حروف انگلیسی کوچک، عدد، نقطه، خط تیره یا زیرخط باشد.",
    en: "Username must be 3–30 characters: lowercase letters, digits, dot, dash or underscore.",
  },
  USERNAME_TAKEN: { fa: "این نام کاربری قبلاً استفاده شده است.", en: "This username is already taken." },
  WEAK_PASSWORD: { fa: "رمز عبور باید حداقل ۸ کاراکتر باشد.", en: "The password must be at least 8 characters." },
  HAS_CASES: {
    fa: "این طراح سابقه‌ی کار دارد و حذف نمی‌شود. به‌جای حذف، حسابش را غیرفعال کنید.",
    en: "This designer has case history and cannot be deleted. Deactivate the account instead.",
  },
};

/** A readable random password (no look-alike characters). */
function generatePassword(length = 10): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

async function copyText(text: string, okMsg: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(okMsg);
  } catch {
    toast.error("Copy failed");
  }
}

const nf = (lang: string) => new Intl.NumberFormat(lang === "fa" ? "fa-IR" : "en-US", { maximumFractionDigits: 1 });

export function AdminDesigners() {
  const { lang } = useTdc();
  const fa = lang === "fa";
  const [designers, setDesigners] = useState<DesignerItem[] | null>(null);
  const [sort, setSort] = useState<"created" | "score" | "open">("created");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DesignerItem | null>(null);
  const [credentials, setCredentials] = useState<{ name: string; username: string; password: string } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await fetch("/api/admin/designers").then((r) => r.json());
      setDesigners(d.designers ?? []);
    } catch {
      setDesigners([]);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const toggleActive = async (d: DesignerItem, active: boolean) => {
    const res = await fetch(`/api/admin/designers/${d.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    if (res.ok) {
      toast.success(active ? (fa ? "حساب فعال شد" : "Account enabled") : fa ? "حساب غیرفعال شد" : "Account disabled");
      load();
    } else toast.error(t(UI.common.error, lang));
  };

  const remove = async (d: DesignerItem) => {
    if (!confirm(fa ? `طراح «${d.name}» حذف شود؟` : `Delete designer "${d.name}"?`)) return;
    const res = await fetch(`/api/admin/designers/${d.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(fa ? "حذف شد" : "Deleted");
      load();
    } else {
      const data = await res.json().catch(() => ({}));
      const e = ERRORS[data.error];
      toast.error(e ? (fa ? e.fa : e.en) : t(UI.common.error, lang));
    }
  };

  if (!designers) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-7 w-7 animate-spin text-orange-400" />
      </div>
    );
  }

  const sorted = [...designers].sort((a, b) => {
    if (sort === "score") return (b.stats.avgScore ?? -1) - (a.stats.avgScore ?? -1);
    if (sort === "open") return b.stats.open - a.stats.open;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-extrabold text-white">{fa ? "طراحان" : "Designers"}</h2>
        <span className="text-xs text-white/40">
          {fa ? "نام کاربری و رمز را شما تعیین می‌کنید؛ طراح نمی‌تواند آن‌ها را تغییر دهد." : "You choose the username and password; designers cannot change them."}
        </span>
        <div className="ms-auto flex items-center gap-2">
          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
            <SelectTrigger className="w-40 rounded-xl border-white/15 bg-white/5 text-white" aria-label="sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#161a21] text-white">
              <SelectItem value="created">{fa ? "ترتیب ثبت" : "Date added"}</SelectItem>
              <SelectItem value="score">{fa ? "بیشترین امتیاز" : "Highest score"}</SelectItem>
              <SelectItem value="open">{fa ? "بیشترین کار فعال" : "Most open cases"}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setFormOpen(true)} className="rounded-full bg-orange-500 font-bold text-white hover:bg-orange-400">
            <Plus className="me-1 h-4 w-4" />
            {fa ? "افزودن طراح" : "Add designer"}
          </Button>
        </div>
      </div>

      {designers.length === 0 && (
        <p className="py-16 text-center text-sm text-white/35">
          {fa ? "هنوز طراحی تعریف نشده. با «افزودن طراح» اولین حساب را بسازید." : "No designers yet. Create the first account with “Add designer”."}
        </p>
      )}

      {sorted.map((d) => {
        const s = d.stats;
        const items: { label: string; value: React.ReactNode }[] = [
          { label: fa ? "کار فعال" : "Open", value: nf(lang).format(s.open) },
          { label: fa ? "تحویل‌شده" : "Delivered", value: nf(lang).format(s.delivered) },
          { label: fa ? "میانگین امتیاز" : "Avg score", value: s.avgScore === null ? "—" : nf(lang).format(s.avgScore) },
          { label: fa ? "رضایت" : "Satisfaction", value: s.avgRating === null ? "—" : <Stars value={s.avgRating} size={12} /> },
          { label: fa ? "میانگین اصلاح" : "Avg revisions", value: s.avgRevisions === null ? "—" : nf(lang).format(s.avgRevisions) },
          { label: fa ? "به‌موقع" : "On time", value: s.onTimeRate === null ? "—" : `${nf(lang).format(s.onTimeRate)}٪` },
          { label: fa ? "زمان تحویل" : "Turnaround", value: fmtHours(s.avgTurnaroundHours, lang) },
        ];
        return (
          <div key={d.id} className={`rounded-2xl border p-4 ${d.active ? "border-white/10 bg-card" : "border-white/5 bg-card/50 opacity-70"}`}>
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-40">
                <p className="text-sm font-extrabold text-white">{d.name}</p>
                <p className="text-xs text-white/45" dir="ltr">@{d.username}{d.phone ? `  ·  ${d.phone}` : ""}</p>
              </div>
              {!d.active && <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-white/60">{fa ? "غیرفعال" : "Disabled"}</span>}
              {s.overdue > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-0.5 text-[10px] font-bold text-red-300">
                  <AlertTriangle className="h-3 w-3" />
                  {nf(lang).format(s.overdue)} {fa ? "دیرکرد" : "overdue"}
                </span>
              )}
              <div className="ms-auto flex items-center gap-1">
                <label className="me-2 flex items-center gap-1.5 text-[11px] text-white/50">
                  <Switch checked={d.active} onCheckedChange={(v) => toggleActive(d, v)} aria-label={fa ? "فعال" : "Active"} />
                  {fa ? "فعال" : "Active"}
                </label>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-white/50 hover:text-white" onClick={() => setEditing(d)} aria-label={fa ? "ویرایش" : "Edit"}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-white/40 hover:text-red-400" onClick={() => remove(d)} aria-label={fa ? "حذف" : "Delete"}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {items.map((it) => (
                <div key={it.label} className="rounded-xl bg-white/[0.04] px-3 py-2">
                  <p className="text-[10px] text-white/40">{it.label}</p>
                  <div className="mt-0.5 text-sm font-black tabular-nums text-white">{it.value}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setExpanded(expanded === d.id ? null : d.id)}
              className="mt-3 flex items-center gap-1 text-xs font-bold text-orange-400 hover:text-orange-300"
            >
              {expanded === d.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {fa ? "کارهای این طراح" : "This designer's cases"}
            </button>
            {expanded === d.id && <DesignerCases designerId={d.id} />}
          </div>
        );
      })}

      {/* create */}
      <DesignerForm
        key={formOpen ? "new-open" : "new-closed"}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={(creds) => {
          setFormOpen(false);
          setCredentials(creds);
          load();
        }}
      />
      {/* edit */}
      <DesignerForm
        key={editing ? `edit-${editing.id}` : "edit-closed"}
        open={!!editing}
        designer={editing ?? undefined}
        onClose={() => setEditing(null)}
        onSaved={(creds) => {
          setEditing(null);
          if (creds) setCredentials(creds);
          load();
        }}
      />

      {/* credentials to hand over (the password cannot be shown again later) */}
      <Dialog open={!!credentials} onOpenChange={(o) => !o && setCredentials(null)}>
        <DialogContent className="border-white/10 bg-[#101318] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-extrabold">
              <KeyRound className="h-5 w-5 text-orange-400" />
              {fa ? "اطلاعات ورود طراح" : "Designer login details"}
            </DialogTitle>
            <DialogDescription className="text-white/50">
              {fa
                ? "این اطلاعات را به طراح بدهید. رمز عبور بعداً قابل نمایش نیست (فقط می‌توانید رمز جدید تعیین کنید)."
                : "Give these to the designer. The password cannot be shown again (you can only set a new one)."}
            </DialogDescription>
          </DialogHeader>
          {credentials && (
            <div className="space-y-3">
              <CredRow label={fa ? "نام" : "Name"} value={credentials.name} />
              <CredRow label={fa ? "نام کاربری" : "Username"} value={credentials.username} copy />
              <CredRow label={fa ? "رمز عبور" : "Password"} value={credentials.password} copy />
              <Button
                className="w-full rounded-full bg-orange-500 font-bold text-white hover:bg-orange-400"
                onClick={() =>
                  copyText(
                    `${fa ? "نام کاربری" : "Username"}: ${credentials.username}\n${fa ? "رمز عبور" : "Password"}: ${credentials.password}`,
                    fa ? "کپی شد" : "Copied"
                  )
                }
              >
                <Copy className="me-1 h-4 w-4" />
                {fa ? "کپی نام کاربری و رمز" : "Copy username & password"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CredRow({ label, value, copy = false }: { label: string; value: string; copy?: boolean }) {
  const { lang } = useTdc();
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <span className="text-xs text-white/50">{label}</span>
      <span className="flex items-center gap-2">
        <span className="font-display text-sm font-bold text-white" dir="ltr">{value}</span>
        {copy && (
          <button
            type="button"
            onClick={() => copyText(value, lang === "fa" ? "کپی شد" : "Copied")}
            className="text-white/40 hover:text-orange-300"
            aria-label="copy"
          >
            <Copy className="h-4 w-4" />
          </button>
        )}
      </span>
    </div>
  );
}

/** Create (no `designer`) or edit a designer. */
function DesignerForm({
  open, designer, onClose, onSaved,
}: {
  open: boolean;
  designer?: DesignerItem;
  onClose: () => void;
  onSaved: (creds: { name: string; username: string; password: string } | null) => void;
}) {
  const { lang } = useTdc();
  const fa = lang === "fa";
  const editing = !!designer;
  const [name, setName] = useState(designer?.name ?? "");
  const [username, setUsername] = useState(designer?.username ?? "");
  const [phone, setPhone] = useState(designer?.phone ?? "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const payload: Record<string, unknown> = { name, username, phone };
      if (password) payload.password = password;
      const res = await fetch(editing ? `/api/admin/designers/${designer!.id}` : "/api/admin/designers", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const e = ERRORS[data.error];
        toast.error(e ? (fa ? e.fa : e.en) : t(UI.common.error, lang));
        return;
      }
      toast.success(t(UI.admin.saved, lang));
      const saved = data.designer as { name: string; username: string };
      // show the credentials when a password was typed (new account, or a new password for an existing one)
      onSaved(password ? { name: saved.name, username: saved.username, password } : null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="border-white/10 bg-[#101318] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-extrabold">
            {editing ? (fa ? "ویرایش طراح" : "Edit designer") : fa ? "افزودن طراح جدید" : "Add a designer"}
          </DialogTitle>
          <DialogDescription className="text-white/50">
            {fa ? "طراح با همین نام کاربری و رمز وارد سایت می‌شود." : "The designer signs in with this username and password."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-white/60">{fa ? "نام و نام خانوادگی" : "Full name"} *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 rounded-xl border-white/15 bg-white/5 text-white" />
          </div>
          <div>
            <Label className="text-white/60">{fa ? "نام کاربری (انگلیسی)" : "Username"} *</Label>
            <Input
              dir="ltr"
              autoCapitalize="none"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="ali.designer"
              className="mt-1.5 rounded-xl border-white/15 bg-white/5 text-white"
            />
          </div>
          <div>
            <Label className="text-white/60">
              {editing ? (fa ? "رمز عبور جدید (خالی = بدون تغییر)" : "New password (empty = keep)") : fa ? "رمز عبور (حداقل ۸ کاراکتر)" : "Password (min 8 characters)"}
              {!editing && " *"}
            </Label>
            <div className="mt-1.5 flex gap-2">
              <Input
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl border-white/15 bg-white/5 font-display text-white"
              />
              <Button type="button" variant="outline" onClick={() => setPassword(generatePassword())} className="shrink-0 rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10">
                <Wand2 className="me-1 h-4 w-4" />
                {fa ? "ساخت رمز" : "Generate"}
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-white/60">{fa ? "شماره تماس (اختیاری)" : "Phone (optional)"}</Label>
            <Input dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5 rounded-xl border-white/15 bg-white/5 text-white tabular-nums" />
          </div>
          <Button
            onClick={save}
            disabled={busy || !name.trim() || !username.trim() || (!editing && password.length < 8)}
            className="w-full rounded-full bg-orange-500 font-bold text-white hover:bg-orange-400"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? t(UI.admin.save, lang) : fa ? "ساخت حساب طراح" : "Create account"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Recent cases of one designer, with the scoring information. */
function DesignerCases({ designerId }: { designerId: string }) {
  const { lang } = useTdc();
  const fa = lang === "fa";
  const [cases, setCases] = useState<CaseItem[] | null>(null);
  useEffect(() => {
    fetch(`/api/admin/cases?designerId=${designerId}`)
      .then((r) => r.json())
      .then((d) => setCases(d.cases ?? []))
      .catch(() => setCases([]));
  }, [designerId]);

  if (!cases) return <Loader2 className="mt-3 h-4 w-4 animate-spin text-orange-400" />;
  if (cases.length === 0) return <p className="mt-3 text-xs text-white/35">{fa ? "هنوز کاری به این طراح داده نشده." : "No cases yet."}</p>;
  return (
    <div className="mt-3 space-y-1.5">
      {cases.slice(0, 20).map((c) => {
        const due = c.status === "DELIVERED" || c.status === "CANCELLED" ? null : dueInfo(c.dueAt, lang);
        return (
          <div key={c.id} className="flex flex-wrap items-center gap-2.5 rounded-lg bg-white/[0.04] px-3 py-2 text-xs">
            <span className="font-display font-bold text-orange-300" dir="ltr">{c.code}</span>
            <span className="text-white/55">{CATEGORIES[c.serviceType] ? (fa ? CATEGORIES[c.serviceType].fa : CATEGORIES[c.serviceType].en) : c.serviceType}</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/70">{t(UI.status[c.status], lang)}</span>
            {(c.revisionCount ?? 0) > 0 && <span className="text-[10px] text-red-300/80">{fa ? "اصلاح" : "rev."} {nf(lang).format(c.revisionCount ?? 0)}</span>}
            {c.rating ? <Stars value={c.rating} size={11} /> : null}
            {due && <span className={`text-[10px] font-bold ${due.overdue ? "text-red-300" : "text-sky-300"}`}>{due.text}</span>}
            {c.score !== null && c.score !== undefined && (
              <span className="ms-auto rounded-full bg-purple-500/15 px-2.5 py-0.5 text-[11px] font-black tabular-nums text-purple-200">{nf(lang).format(c.score)}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
