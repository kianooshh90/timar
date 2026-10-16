"use client";

import { Star } from "lucide-react";
import type { CaseEventItem, Lang } from "./store";
import { fmtDate } from "./i18n";

/** Labels of the activity-log entries of a case. */
export const EVENT_LABEL: Record<string, { fa: string; en: string; dot: string }> = {
  ASSIGNED: { fa: "تخصیص به طراح", en: "Assigned to designer", dot: "bg-sky-400" },
  UNASSIGNED: { fa: "لغو تخصیص", en: "Unassigned", dot: "bg-white/40" },
  STARTED: { fa: "شروع کار", en: "Work started", dot: "bg-orange-400" },
  SUBMITTED: { fa: "ارسال برای بازبینی", en: "Submitted for review", dot: "bg-teal-400" },
  REVISION: { fa: "درخواست اصلاح", en: "Revision requested", dot: "bg-red-400" },
  DELIVERED: { fa: "تحویل به لابراتوار", en: "Delivered to lab", dot: "bg-emerald-400" },
  RATED: { fa: "رضایت لابراتوار", en: "Lab satisfaction", dot: "bg-yellow-400" },
  SCORED: { fa: "امتیاز مدیریت", en: "Admin score", dot: "bg-purple-400" },
  NOTE: { fa: "یادداشت", en: "Note", dot: "bg-white/60" },
  STATUS: { fa: "تغییر وضعیت", en: "Status change", dot: "bg-white/40" },
};

const ROLE_LABEL: Record<string, { fa: string; en: string }> = {
  ADMIN: { fa: "مدیریت", en: "Admin" },
  DESIGNER: { fa: "طراح", en: "Designer" },
  LAB: { fa: "لابراتوار", en: "Lab" },
};

export function EventTimeline({ events, lang }: { events: CaseEventItem[]; lang: Lang }) {
  const fa = lang === "fa";
  if (!events || events.length === 0) {
    return <p className="text-center text-xs text-white/30">{fa ? "هنوز فعالیتی ثبت نشده" : "No activity yet"}</p>;
  }
  return (
    <ol className="space-y-3">
      {events.map((e) => {
        const label = EVENT_LABEL[e.type] ?? { fa: e.type, en: e.type, dot: "bg-white/40" };
        const role = e.actorRole ? ROLE_LABEL[e.actorRole] : null;
        return (
          <li key={e.id} className="flex gap-3">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${label.dot}`} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white/80">
                {fa ? label.fa : label.en}
                <span className="ms-2 font-normal text-white/35">
                  {role ? (fa ? role.fa : role.en) : ""}
                  {e.actorName ? ` · ${e.actorName}` : ""}
                </span>
              </p>
              {e.note && <p className="mt-0.5 whitespace-pre-line text-xs leading-6 text-white/60">{e.note}</p>}
              <p className="mt-0.5 text-[10px] text-white/30">{fmtDate(e.createdAt, lang)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** "3 hours left" / "2 hours overdue" for a deadline. */
export function dueInfo(due: string | null | undefined, lang: Lang, now: number = Date.now()): { text: string; overdue: boolean } | null {
  if (!due) return null;
  const t = new Date(due).getTime();
  if (Number.isNaN(t)) return null;
  const diff = t - now;
  const overdue = diff < 0;
  const mins = Math.round(Math.abs(diff) / 60_000);
  const nf = new Intl.NumberFormat(lang === "fa" ? "fa-IR" : "en-US");
  let amount: string;
  if (mins < 60) amount = lang === "fa" ? `${nf.format(Math.max(mins, 1))} دقیقه` : `${nf.format(Math.max(mins, 1))} min`;
  else if (mins < 48 * 60) amount = lang === "fa" ? `${nf.format(Math.round(mins / 60))} ساعت` : `${nf.format(Math.round(mins / 60))} h`;
  else amount = lang === "fa" ? `${nf.format(Math.round(mins / 1440))} روز` : `${nf.format(Math.round(mins / 1440))} d`;
  const text = lang === "fa" ? (overdue ? `${amount} دیرکرد` : `${amount} مانده`) : overdue ? `${amount} overdue` : `${amount} left`;
  return { text, overdue };
}

export function Stars({ value, size = 14 }: { value: number | null | undefined; size?: number }) {
  const v = Math.round(value ?? 0);
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${v}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={i <= v ? "fill-yellow-400 text-yellow-400" : "text-white/20"}
        />
      ))}
    </span>
  );
}

export function fmtHours(h: number | null | undefined, lang: Lang): string {
  if (h === null || h === undefined) return "—";
  const nf = new Intl.NumberFormat(lang === "fa" ? "fa-IR" : "en-US", { maximumFractionDigits: 1 });
  if (h < 48) return lang === "fa" ? `${nf.format(h)} ساعت` : `${nf.format(h)} h`;
  return lang === "fa" ? `${nf.format(h / 24)} روز` : `${nf.format(h / 24)} d`;
}
