"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, KeyRound, Copy, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useTdc } from "../store";
import { t, UI, fmtDate } from "../i18n";
import { toast } from "sonner";

interface LabUser {
  id: string;
  name: string;
  labName?: string | null;
  email: string;
  phone?: string | null;
  city?: string | null;
  active: boolean;
  createdAt: string;
  caseCount: number;
  resetRequested: boolean;
}

/** Registered labs. The admin can set a temporary password (used by the "forgot password" flow) or disable an account. */
export function AdminUsers() {
  const { lang } = useTdc();
  const fa = lang === "fa";
  const [users, setUsers] = useState<LabUser[] | null>(null);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [temp, setTemp] = useState<{ name: string; email: string; password: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await fetch("/api/admin/users").then((r) => r.json());
      setUsers(d.users ?? []);
    } catch {
      setUsers([]);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const resetPassword = async (u: LabUser) => {
    if (!confirm(fa ? `برای «${u.labName || u.name}» رمز موقت جدید ساخته شود؟ رمز فعلی از کار می‌افتد.` : `Create a new temporary password for "${u.labName || u.name}"? The current password stops working.`)) return;
    setBusyId(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetPassword: true }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.tempPassword) return toast.error(t(UI.common.error, lang));
      setTemp({ name: u.labName || u.name, email: u.email, password: d.tempPassword });
      load();
    } finally {
      setBusyId(null);
    }
  };

  const setActive = async (u: LabUser, active: boolean) => {
    setBusyId(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (res.ok) {
        toast.success(active ? (fa ? "حساب فعال شد" : "Account enabled") : fa ? "حساب غیرفعال شد" : "Account disabled");
        load();
      } else toast.error(t(UI.common.error, lang));
    } finally {
      setBusyId(null);
    }
  };

  if (!users) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-7 w-7 animate-spin text-orange-400" />
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const list = users
    .filter((u) => !q || [u.name, u.labName, u.email, u.phone, u.city].some((x) => (x ?? "").toLowerCase().includes(q)))
    .sort((a, b) => Number(b.resetRequested) - Number(a.resetRequested));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-extrabold text-white">{fa ? "لابراتوارها و کلینیک‌ها" : "Labs & clinics"}</h2>
        <div className="relative ms-auto w-full sm:w-64">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={fa ? "جستجو…" : "Search…"}
            className="rounded-xl border-white/15 bg-white/5 ps-9 text-white placeholder:text-white/25"
          />
        </div>
      </div>

      {list.length === 0 && <p className="py-16 text-center text-sm text-white/35">{fa ? "موردی پیدا نشد" : "Nothing found"}</p>}

      {list.map((u) => (
        <div
          key={u.id}
          className={`flex flex-wrap items-center gap-3 rounded-2xl border p-4 ${
            u.resetRequested ? "border-amber-500/40 bg-amber-500/[0.05]" : "border-white/10 bg-card"
          } ${u.active ? "" : "opacity-60"}`}
        >
          <div className="min-w-44 flex-1">
            <p className="text-sm font-bold text-white">{u.labName || u.name}</p>
            <p className="text-xs text-white/45">
              {u.labName ? `${u.name} · ` : ""}
              <span dir="ltr">{u.email}</span>
            </p>
            <p className="text-[11px] text-white/35">
              {u.phone ? <span dir="ltr" className="me-2 tabular-nums">{u.phone}</span> : null}
              {u.city ? `${u.city} · ` : ""}
              {fmtDate(u.createdAt, lang)}
            </p>
          </div>
          {u.resetRequested && (
            <span className="rounded-full bg-amber-500/20 px-3 py-1 text-[11px] font-bold text-amber-300">
              {fa ? "درخواست بازیابی رمز" : "Password reset requested"}
            </span>
          )}
          <span className="text-xs text-white/45">
            {fa ? "کیس:" : "Cases:"} <b className="tabular-nums text-white/80">{new Intl.NumberFormat(fa ? "fa-IR" : "en-US").format(u.caseCount)}</b>
          </span>
          <label className="flex items-center gap-1.5 text-[11px] text-white/50">
            <Switch checked={u.active} disabled={busyId === u.id} onCheckedChange={(v) => setActive(u, v)} aria-label={fa ? "فعال" : "Active"} />
            {fa ? "فعال" : "Active"}
          </label>
          <Button
            size="sm"
            variant="outline"
            disabled={busyId === u.id}
            onClick={() => resetPassword(u)}
            className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
          >
            {busyId === u.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="me-1 h-3.5 w-3.5" />}
            {fa ? "رمز موقت" : "Temp password"}
          </Button>
        </div>
      ))}

      <Dialog open={!!temp} onOpenChange={(o) => !o && setTemp(null)}>
        <DialogContent className="border-white/10 bg-[#101318] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-extrabold">
              <KeyRound className="h-5 w-5 text-orange-400" />
              {fa ? "رمز موقت ساخته شد" : "Temporary password created"}
            </DialogTitle>
            <DialogDescription className="text-white/50">
              {fa
                ? "این رمز را به کاربر اطلاع دهید. بعد از ورود می‌تواند آن را از بخش «پروفایل» تغییر دهد. این رمز دوباره نمایش داده نمی‌شود."
                : "Tell this password to the user. After signing in they can change it in their profile. It will not be shown again."}
            </DialogDescription>
          </DialogHeader>
          {temp && (
            <div className="space-y-3">
              <p className="text-sm text-white/70">{temp.name} — <span dir="ltr" className="text-white/50">{temp.email}</span></p>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="font-display text-lg font-bold tracking-wider text-white" dir="ltr">{temp.password}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-orange-300 hover:text-orange-200"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(temp.password);
                      toast.success(fa ? "کپی شد" : "Copied");
                    } catch {
                      toast.error("Copy failed");
                    }
                  }}
                >
                  <Copy className="me-1 h-4 w-4" />
                  {fa ? "کپی" : "Copy"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
