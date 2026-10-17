"use client";

import { useRef, useState } from "react";
import { Loader2, FilePlus2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { FileDrop } from "../FileDrop";
import { useTdc, type SavedFile } from "../store";
import { toast } from "sonner";

/** Lets a lab attach more files (or links) to a case it already submitted. Each upload is attached right away. */
export function AddCaseFiles({ caseId, onAdded }: { caseId: string; onAdded: () => void }) {
  const { lang } = useTdc();
  const fa = lang === "fa";
  const sent = useRef<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const attach = async (list: SavedFile[]) => {
    const fresh = list.filter((f) => !sent.current.has(f.path));
    if (fresh.length === 0) return;
    fresh.forEach((f) => sent.current.add(f.path));
    setBusy(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: fresh }),
      });
      if (!res.ok) {
        fresh.forEach((f) => sent.current.delete(f.path));
        toast.error(fa ? "افزودن فایل به کیس انجام نشد. دوباره تلاش کنید." : "Could not add the file to the case. Please try again.");
        return;
      }
      toast.success(fa ? "فایل به کیس اضافه شد" : "File added to the case");
      onAdded();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <Label className="flex items-center gap-1.5 text-white/70">
        <FilePlus2 className="h-4 w-4 text-orange-400" />
        {fa ? "افزودن فایل جدید به این کیس" : "Add more files to this case"}
        {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-400" />}
      </Label>
      <p className="text-[11px] leading-5 text-white/40">
        {fa
          ? "هر فایل یا لینکی که اینجا اضافه کنید همان لحظه به همین کیس وصل می‌شود و طراح و مدیریت آن را می‌بینند."
          : "Every file or link you add here is attached to this case immediately; the designer and admin can see it."}
      </p>
      <FileDrop kind="case-file" value={[]} onChange={attach} compact />
    </div>
  );
}
