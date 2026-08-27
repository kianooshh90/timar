"use client";

import { useState } from "react";
import { Save, Loader2, PackageCheck, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTdc, type CaseItem, type SavedFile } from "../store";
import { t, UI, CATEGORIES, fmtDate, fmtBytes } from "../i18n";
import { FileDrop } from "../FileDrop";
import { toast } from "sonner";

export function parseSafe(json?: string): SavedFile[] {
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-white/35">{label}</p>
      <p className="mt-0.5 text-sm text-white/85">{value}</p>
    </div>
  );
}

/** Case detail with messages + delivery files — shared by admin & lab dashboards */
export function CaseDetailDialog({
  kase,
  onClose,
  onChanged,
  isAdmin,
}: {
  kase: CaseItem | null;
  onClose: () => void;
  onChanged: () => void;
  isAdmin: boolean;
}) {
  if (!kase) return null;
  return (
    <CaseDetailInner
      key={`${kase.id}-${kase.updatedAt}`}
      kase={kase}
      onClose={onClose}
      onChanged={onChanged}
      isAdmin={isAdmin}
    />
  );
}

function CaseDetailInner({
  kase,
  onClose,
  onChanged,
  isAdmin,
}: {
  kase: CaseItem;
  onClose: () => void;
  onChanged: () => void;
  isAdmin: boolean;
}) {
  const { lang } = useTdc();
  const [detail, setDetail] = useState<CaseItem | null>(kase);
  const [msg, setMsg] = useState("");
  const [deliveryFiles, setDeliveryFiles] = useState<SavedFile[]>(() => parseSafe(kase.deliveryFiles));
  const [savingDelivery, setSavingDelivery] = useState(false);

  const refresh = async () => {
    const res = await fetch(`/api/cases/${kase.id}/messages`);
    if (res.ok) {
      const d = await res.json();
      setDetail(d.case);
      setDeliveryFiles(parseSafe(d.case.deliveryFiles));
    }
    onChanged();
  };

  const sendMsg = async () => {
    if (!msg.trim()) return;
    await fetch(`/api/cases/${kase.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: msg.trim() }),
    });
    setMsg("");
    refresh();
  };

  const saveDelivery = async () => {
    setSavingDelivery(true);
    await fetch(`/api/admin/cases/${kase.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deliveryFiles }),
    });
    setSavingDelivery(false);
    toast.success(t(UI.admin.saved, lang));
    refresh();
  };

  const caseFiles = parseSafe(detail?.files);

  return (
    <Dialog open={!!kase} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto thin-scroll border-white/10 bg-[#101318] text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-extrabold" dir="ltr">
            <span className="font-display text-orange-300">{kase.code}</span>
            <span className="text-xs font-normal text-white/40">
              {t(UI.status[detail?.status ?? "RECEIVED"], lang)}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <Info label={lang === "fa" ? "بیمار" : "Patient"} value={detail?.patientName || "—"} />
            <Info label={lang === "fa" ? "دندان‌ها" : "Teeth"} value={detail?.toothNumbers || "—"} />
            <Info
              label={lang === "fa" ? "خدمت" : "Service"}
              value={
                CATEGORIES[detail?.serviceType ?? ""]
                  ? lang === "fa"
                    ? CATEGORIES[detail!.serviceType].fa
                    : CATEGORIES[detail!.serviceType].en
                  : "—"
              }
            />
            <Info label={lang === "fa" ? "تاریخ" : "Date"} value={fmtDate(detail?.createdAt ?? "", lang)} />
            <div className="col-span-2">
              <Info label={lang === "fa" ? "توضیحات" : "Notes"} value={detail?.notes || "—"} />
            </div>
            {isAdmin && detail?.user && (
              <div className="col-span-2 border-t border-white/10 pt-2">
                <Info
                  label={lang === "fa" ? "لابراتوار" : "Lab"}
                  value={`${detail.user.labName || detail.user.name} — ${detail.user.email}${
                    detail.user.phone ? " — " + detail.user.phone : ""
                  }`}
                />
              </div>
            )}
          </div>

          {/* Case files */}
          {caseFiles.length > 0 && (
            <div>
              <Label className="text-white/60">{lang === "fa" ? "فایل‌های کیس" : "Case files"}</Label>
              <ul className="mt-2 space-y-1.5">
                {caseFiles.map((f, i) => (
                  <li key={i}>
                    <a
                      href={`/api/download?p=${encodeURIComponent(f.path)}`}
                      download
                      className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-white/80 transition hover:text-orange-300"
                    >
                      <PackageCheck className="h-3.5 w-3.5 text-teal-400" />
                      <span className="flex-1 truncate" dir="ltr">{f.name}</span>
                      <span className="text-white/35">{fmtBytes(f.size, lang)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Delivery files */}
          {isAdmin ? (
            <div>
              <Label className="text-white/60">
                {lang === "fa" ? "فایل‌های تحویل (طراحی نهایی)" : "Delivery files (final designs)"}
              </Label>
              <div className="mt-2">
                <FileDrop kind="delivery-file" value={deliveryFiles} onChange={setDeliveryFiles} compact />
              </div>
              <Button
                size="sm"
                onClick={saveDelivery}
                disabled={savingDelivery}
                className="mt-2 rounded-full bg-orange-500 font-bold text-white hover:bg-orange-400"
              >
                {savingDelivery ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="me-1 h-3.5 w-3.5" />}
                {t(UI.admin.save, lang)}
              </Button>
            </div>
          ) : (
            parseSafe(detail?.deliveryFiles).length > 0 && (
              <div>
                <Label className="text-teal-300">{lang === "fa" ? "فایل‌های نهایی شما" : "Your final files"}</Label>
                <ul className="mt-2 space-y-1.5">
                  {parseSafe(detail?.deliveryFiles).map((f, i) => (
                    <li key={i}>
                      <a
                        href={`/api/download?p=${encodeURIComponent(f.path)}`}
                        download
                        className="flex items-center gap-2 rounded-lg bg-teal-500/10 px-3 py-2 text-xs text-teal-200 transition hover:text-teal-100"
                      >
                        <PackageCheck className="h-3.5 w-3.5" />
                        <span className="flex-1 truncate" dir="ltr">{f.name}</span>
                        <span className="text-white/35">{fmtBytes(f.size, lang)}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}

          {/* Messages */}
          <div>
            <Label className="text-white/60">{t(UI.common.messages, lang)}</Label>
            <div className="mt-2 max-h-52 space-y-2 overflow-y-auto thin-scroll rounded-xl border border-white/10 bg-white/[0.02] p-3">
              {(detail?.messages ?? []).length === 0 && (
                <p className="text-center text-xs text-white/30">{t(UI.common.noData, lang)}</p>
              )}
              {(detail?.messages ?? []).map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-6 ${
                    m.fromAdmin ? "ms-auto bg-orange-500/15 text-orange-100" : "me-auto bg-white/10 text-white/85"
                  }`}
                >
                  <p className="mb-0.5 text-[10px] font-bold opacity-60">
                    {m.fromAdmin ? "TDC" : lang === "fa" ? "لابراتوار" : "Lab"}
                  </p>
                  {m.body}
                  <p className="mt-1 text-[9px] opacity-40">{fmtDate(m.createdAt, lang)}</p>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMsg()}
                placeholder={lang === "fa" ? "پیام…" : "Message…"}
                className="rounded-xl border-white/15 bg-white/5 text-white placeholder:text-white/25"
                aria-label={t(UI.common.sendMsg, lang)}
              />
              <Button
                size="icon"
                onClick={sendMsg}
                className="shrink-0 rounded-xl bg-orange-500 text-white hover:bg-orange-400"
                aria-label={t(UI.common.sendMsg, lang)}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
