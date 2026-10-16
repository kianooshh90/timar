"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, UserCheck, UserX, CheckCircle2, RotateCcw, Award, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTdc, type CaseItem, type DesignerItem } from "../store";
import { suggestScore } from "@/lib/scoring";
import { EventTimeline, dueInfo, Stars } from "../case-events";
import { toast } from "sonner";

const DUE_OPTIONS: { v: string; fa: string; en: string }[] = [
  { v: "0", fa: "بدون مهلت", en: "No deadline" },
  { v: "2", fa: "۲ ساعت", en: "2 hours" },
  { v: "4", fa: "۴ ساعت", en: "4 hours" },
  { v: "8", fa: "۸ ساعت", en: "8 hours" },
  { v: "24", fa: "۲۴ ساعت", en: "24 hours" },
  { v: "48", fa: "۲ روز", en: "2 days" },
  { v: "72", fa: "۳ روز", en: "3 days" },
];

const ERRORS: Record<string, { fa: string; en: string }> = {
  INVALID_STATE: { fa: "در وضعیت فعلی کیس این کار ممکن نیست.", en: "Not possible in the case's current state." },
  INVALID_DESIGNER: { fa: "طراح انتخاب‌شده معتبر یا فعال نیست.", en: "The selected designer is not valid or active." },
  NO_DELIVERY_FILES: { fa: "هنوز هیچ فایل تحویلی ثبت نشده است.", en: "No delivery files have been added yet." },
  NOTE_REQUIRED: { fa: "توضیح لازم است.", en: "A note is required." },
  INVALID_SCORE: { fa: "امتیاز باید عددی صحیح بین ۰ تا ۱۰۰ باشد.", en: "The score must be a whole number between 0 and 100." },
};

/** Admin-only part of the case dialog: hand the case to a designer, review, score, and the activity log. */
export function AdminWorkflowSection({ caseId, onChanged }: { caseId: string; onChanged: () => void }) {
  const { lang } = useTdc();
  const fa = lang === "fa";
  const [kase, setKase] = useState<CaseItem | null>(null);
  const [designers, setDesigners] = useState<DesignerItem[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [designerId, setDesignerId] = useState("");
  const [dueHours, setDueHours] = useState("24");
  const [instructions, setInstructions] = useState("");
  const [revisionNote, setRevisionNote] = useState("");
  const [scoreInput, setScoreInput] = useState("");
  const [scoreNote, setScoreNote] = useState("");
  const [noteInput, setNoteInput] = useState("");

  const load = useCallback(async () => {
    try {
      const [c, d] = await Promise.all([
        fetch(`/api/admin/cases/${caseId}`).then((r) => r.json()),
        fetch("/api/admin/designers").then((r) => r.json()),
      ]);
      if (c.case) {
        setKase(c.case);
        setScoreInput(c.case.score !== null && c.case.score !== undefined ? String(c.case.score) : "");
        setScoreNote(c.case.scoreNote ?? "");
        setDesignerId((prev) => prev || c.case.designerId || "");
      }
      setDesigners(d.designers ?? []);
    } catch {
      /* keep what we have */
    }
  }, [caseId]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (action: string, extra: Record<string, unknown> = {}, okMsg?: string): Promise<boolean> => {
    setBusy(action);
    try {
      const res = await fetch(`/api/admin/cases/${caseId}/workflow`, {
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

  if (!kase) {
    return (
      <div className="grid place-items-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-orange-400" />
      </div>
    );
  }

  const closed = kase.status === "DELIVERED" || kase.status === "CANCELLED";
  const due = dueInfo(kase.dueAt, lang);
  const activeDesigners = designers.filter((d) => d.active);
  const late = !!(kase.dueAt && kase.deliveredAt && new Date(kase.deliveredAt) > new Date(kase.dueAt));
  const suggestion = suggestScore({ revisions: kase.revisionCount ?? 0, rating: kase.rating, late });

  return (
    <div className="space-y-4 rounded-xl border border-orange-500/20 bg-orange-500/[0.03] p-4">
      <p className="text-sm font-extrabold text-orange-200">{fa ? "مدیریت کار و طراح" : "Work & designer management"}</p>

      {/* ---- assignment ---- */}
      <div className="space-y-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
        <p className="flex items-center gap-1.5 text-xs font-bold text-white/70">
          <UserCheck className="h-3.5 w-3.5 text-sky-400" />
          {fa ? "طراح مسئول" : "Assigned designer"}
        </p>
        {kase.designer ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-bold text-white">{kase.designer.name}</span>
            {kase.designer.username && (
              <span className="text-xs text-white/40" dir="ltr">@{kase.designer.username}</span>
            )}
            {due && !closed && (
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${due.overdue ? "bg-red-500/15 text-red-300" : "bg-sky-500/15 text-sky-300"}`}>
                {due.text}
              </span>
            )}
          </div>
        ) : (
          <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            {fa ? "این کیس هنوز به هیچ طراحی داده نشده است." : "This case has not been assigned to a designer yet."}
          </p>
        )}
        {kase.designerNote && (
          <p className="whitespace-pre-line rounded-lg bg-white/5 px-3 py-2 text-xs leading-6 text-white/60">
            📌 {kase.designerNote}
          </p>
        )}

        {!closed && (
          <div className="space-y-2 border-t border-white/10 pt-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label className="text-[11px] text-white/50">{fa ? "طراح" : "Designer"}</Label>
                <Select value={designerId} onValueChange={setDesignerId}>
                  <SelectTrigger className="mt-1 rounded-xl border-white/15 bg-white/5 text-white" aria-label="designer">
                    <SelectValue placeholder={fa ? "انتخاب طراح…" : "Choose a designer…"} />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#161a21] text-white">
                    {activeDesigners.length === 0 && (
                      <p className="px-3 py-2 text-xs text-white/40">
                        {fa ? "هنوز طراحی تعریف نشده (تب «طراحان»)" : "No designers yet (see the Designers tab)"}
                      </p>
                    )}
                    {activeDesigners.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name} — {fa ? `${d.stats.open} کار فعال` : `${d.stats.open} open`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] text-white/50">{fa ? "مهلت تحویل" : "Deadline"}</Label>
                <Select value={dueHours} onValueChange={setDueHours}>
                  <SelectTrigger className="mt-1 rounded-xl border-white/15 bg-white/5 text-white" aria-label="deadline">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#161a21] text-white">
                    {DUE_OPTIONS.map((o) => (
                      <SelectItem key={o.v} value={o.v}>{fa ? o.fa : o.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={2}
              placeholder={fa ? "توضیح یا دستور کار برای طراح (اختیاری)" : "Instructions for the designer (optional)"}
              className="rounded-xl border-white/15 bg-white/5 text-sm text-white placeholder:text-white/25"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={!designerId || busy !== null}
                onClick={() =>
                  act("ASSIGN", { designerId, dueHours: Number(dueHours), note: instructions }, fa ? "کیس به طراح داده شد" : "Case assigned")
                }
                className="rounded-full bg-sky-500 font-bold text-white hover:bg-sky-400"
              >
                {busy === "ASSIGN" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="me-1 h-3.5 w-3.5" />}
                {kase.designer ? (fa ? "تغییر طراح / مهلت" : "Reassign") : fa ? "تخصیص به طراح" : "Assign"}
              </Button>
              {kase.designer && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy !== null}
                  onClick={() => act("UNASSIGN", {}, fa ? "تخصیص لغو شد" : "Unassigned")}
                  className="text-white/50 hover:text-red-400"
                >
                  <UserX className="me-1 h-3.5 w-3.5" />
                  {fa ? "لغو تخصیص" : "Unassign"}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ---- review (designer submitted) ---- */}
      {(kase.status === "QC" || kase.status === "DELIVERED") && (
        <div className="space-y-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <p className="flex items-center gap-1.5 text-xs font-bold text-white/70">
            <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
            {kase.status === "QC"
              ? fa ? "بازبینی: طراح کار را فرستاده است" : "Review: the designer submitted the work"
              : fa ? "کار تحویل لابراتوار شده است" : "Delivered to the lab"}
          </p>
          {kase.status === "QC" && (
            <Button
              size="sm"
              disabled={busy !== null}
              onClick={() => act("APPROVE", {}, fa ? "کار به لابراتوار تحویل شد" : "Delivered to the lab")}
              className="rounded-full bg-emerald-500 font-bold text-white hover:bg-emerald-400"
            >
              {busy === "APPROVE" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="me-1 h-3.5 w-3.5" />}
              {fa ? "تأیید و تحویل به لابراتوار" : "Approve & deliver to lab"}
            </Button>
          )}
          <div className="space-y-2">
            <Textarea
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              rows={2}
              placeholder={fa ? "اگر اصلاح لازم است، بنویسید چه چیزی باید عوض شود" : "If changes are needed, describe them"}
              className="rounded-xl border-white/15 bg-white/5 text-sm text-white placeholder:text-white/25"
            />
            <Button
              size="sm"
              variant="outline"
              disabled={revisionNote.trim().length < 3 || busy !== null}
              onClick={async () => {
                const ok = await act("REVISION", { note: revisionNote }, fa ? "برای اصلاح به طراح برگشت" : "Sent back to the designer");
                if (ok) setRevisionNote("");
              }}
              className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              {busy === "REVISION" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="me-1 h-3.5 w-3.5" />}
              {fa ? "برگشت برای اصلاح" : "Send back for changes"}
            </Button>
          </div>
        </div>
      )}

      {/* ---- score ---- */}
      {kase.status === "DELIVERED" && kase.designer && (
        <div className="space-y-3 rounded-lg border border-purple-400/20 bg-purple-400/[0.04] p-3">
          <p className="flex items-center gap-1.5 text-xs font-bold text-purple-200">
            <Award className="h-3.5 w-3.5" />
            {fa ? `امتیاز ${kase.designer.name} برای این کیس` : `Score for ${kase.designer.name}`}
          </p>
          <div className="grid gap-2 text-xs text-white/60 sm:grid-cols-3">
            <div className="rounded-lg bg-white/5 px-3 py-2">
              {fa ? "دفعات اصلاح" : "Revisions"}
              <p className="mt-0.5 text-base font-black tabular-nums text-white">{new Intl.NumberFormat(fa ? "fa-IR" : "en-US").format(kase.revisionCount ?? 0)}</p>
            </div>
            <div className="rounded-lg bg-white/5 px-3 py-2">
              {fa ? "رضایت لابراتوار" : "Lab satisfaction"}
              <div className="mt-1">{kase.rating ? <Stars value={kase.rating} /> : <span className="text-white/35">{fa ? "ثبت نشده" : "not rated"}</span>}</div>
            </div>
            <div className="rounded-lg bg-white/5 px-3 py-2">
              {fa ? "تحویل" : "Delivery"}
              <p className={`mt-0.5 text-sm font-bold ${late ? "text-red-300" : "text-emerald-300"}`}>
                {kase.dueAt ? (late ? (fa ? "با تأخیر" : "Late") : fa ? "به‌موقع" : "On time") : "—"}
              </p>
            </div>
          </div>
          {kase.ratingComment && (
            <p className="rounded-lg bg-white/5 px-3 py-2 text-xs leading-6 text-white/60">💬 {kase.ratingComment}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/55">
            <span>
              {fa ? "امتیاز پیشنهادی سیستم:" : "System suggestion:"}{" "}
              <b className="text-purple-200 tabular-nums">{new Intl.NumberFormat(fa ? "fa-IR" : "en-US").format(suggestion.score)}</b>
            </span>
            <span className="text-white/30">
              (۱۰۰ − {suggestion.revisionPenalty} {fa ? "اصلاح" : "rev."} − {suggestion.ratingPenalty} {fa ? "رضایت" : "sat."} − {suggestion.latePenalty} {fa ? "تأخیر" : "late"})
            </span>
            <Button size="sm" variant="ghost" className="h-7 text-purple-300 hover:text-purple-100" onClick={() => setScoreInput(String(suggestion.score))}>
              {fa ? "استفاده از پیشنهاد" : "Use suggestion"}
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-[120px_1fr]">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              value={scoreInput}
              onChange={(e) => setScoreInput(e.target.value)}
              placeholder="0 – 100"
              className="rounded-xl border-white/15 bg-white/5 text-white tabular-nums"
              dir="ltr"
              aria-label={fa ? "امتیاز" : "Score"}
            />
            <Input
              value={scoreNote}
              onChange={(e) => setScoreNote(e.target.value)}
              placeholder={fa ? "توضیح برای طراح (اختیاری)" : "Comment for the designer (optional)"}
              className="rounded-xl border-white/15 bg-white/5 text-white placeholder:text-white/25"
            />
          </div>
          <Button
            size="sm"
            disabled={scoreInput.trim() === "" || busy !== null}
            onClick={() => act("SCORE", { score: scoreInput, note: scoreNote }, fa ? "امتیاز ثبت شد" : "Score saved")}
            className="rounded-full bg-purple-500 font-bold text-white hover:bg-purple-400"
          >
            {busy === "SCORE" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="me-1 h-3.5 w-3.5" />}
            {kase.score !== null && kase.score !== undefined ? (fa ? "به‌روزرسانی امتیاز" : "Update score") : fa ? "ثبت امتیاز" : "Save score"}
          </Button>
        </div>
      )}

      {/* ---- activity log + internal note ---- */}
      <div className="space-y-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
        <p className="flex items-center gap-1.5 text-xs font-bold text-white/70">
          <StickyNote className="h-3.5 w-3.5 text-white/50" />
          {fa ? "تاریخچه و یادداشت داخلی (فقط مدیریت و طراح می‌بینند)" : "Activity & internal notes (admin + designer only)"}
        </p>
        <div className="max-h-48 overflow-y-auto thin-scroll pe-1">
          <EventTimeline events={kase.events ?? []} lang={lang} />
        </div>
        <div className="flex gap-2">
          <Input
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === "Enter" && noteInput.trim()) {
                const ok = await act("NOTE", { note: noteInput }, fa ? "یادداشت ثبت شد" : "Note added");
                if (ok) setNoteInput("");
              }
            }}
            placeholder={fa ? "یادداشت برای طراح…" : "Note for the designer…"}
            className="rounded-xl border-white/15 bg-white/5 text-sm text-white placeholder:text-white/25"
          />
          <Button
            size="sm"
            disabled={!noteInput.trim() || busy !== null}
            onClick={async () => {
              const ok = await act("NOTE", { note: noteInput }, fa ? "یادداشت ثبت شد" : "Note added");
              if (ok) setNoteInput("");
            }}
            className="shrink-0 rounded-xl bg-white/10 text-white hover:bg-white/15"
          >
            {fa ? "ثبت" : "Add"}
          </Button>
        </div>
      </div>
    </div>
  );
}
