"use client";

import { useState } from "react";
import { Star, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useTdc, type CaseItem } from "../store";
import { toast } from "sonner";

/** Shown to the lab on a delivered case: rate the result, or send it back for changes. */
export function LabFeedbackSection({ kase, onChanged }: { kase: CaseItem; onChanged: () => void }) {
  const { lang } = useTdc();
  const fa = lang === "fa";
  const [rating, setRating] = useState<number>(kase.rating ?? 0);
  const [comment, setComment] = useState(kase.ratingComment ?? "");
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");
  const [busy, setBusy] = useState<"rate" | "revision" | null>(null);

  if (kase.status !== "DELIVERED") return null;

  const send = async (payload: Record<string, unknown>, kind: "rate" | "revision", okMsg: string) => {
    setBusy(kind);
    try {
      const res = await fetch(`/api/cases/${kase.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        toast.error(fa ? "ثبت نشد. دوباره تلاش کنید." : "Could not save. Please try again.");
        return;
      }
      toast.success(okMsg);
      onChanged();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-yellow-400/20 bg-yellow-400/[0.04] p-4">
      <div>
        <Label className="text-yellow-200">
          {fa ? "نظر شما درباره‌ی این طراحی" : "How satisfied are you with this design?"}
        </Label>
        <div className="mt-2 flex items-center gap-1" role="radiogroup" aria-label={fa ? "امتیاز رضایت" : "Satisfaction"}>
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={rating === i}
              onClick={() => setRating(i)}
              className="rounded p-0.5 transition hover:scale-110"
              aria-label={`${i}`}
            >
              <Star className={`h-7 w-7 ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-white/25"}`} />
            </button>
          ))}
        </div>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          placeholder={fa ? "توضیح (اختیاری)" : "Comment (optional)"}
          className="mt-2 rounded-xl border-white/15 bg-white/5 text-sm text-white placeholder:text-white/25"
        />
        <Button
          size="sm"
          disabled={rating === 0 || busy !== null}
          onClick={() => send({ rating, comment }, "rate", fa ? "نظر شما ثبت شد. ممنون!" : "Thank you for your feedback!")}
          className="mt-2 rounded-full bg-yellow-500 font-bold text-black hover:bg-yellow-400"
        >
          {busy === "rate" ? <Loader2 className="h-4 w-4 animate-spin" /> : fa ? (kase.rating ? "به‌روزرسانی نظر" : "ثبت نظر") : kase.rating ? "Update" : "Submit"}
        </Button>
      </div>

      <div className="border-t border-white/10 pt-3">
        {!revisionOpen ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRevisionOpen(true)}
            className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10"
          >
            <RotateCcw className="me-1 h-3.5 w-3.5" />
            {fa ? "نیاز به اصلاح دارد" : "Request a change"}
          </Button>
        ) : (
          <div className="space-y-2">
            <Label className="text-white/70">{fa ? "چه چیزی باید اصلاح شود؟" : "What should be changed?"}</Label>
            <Textarea
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              rows={3}
              className="rounded-xl border-white/15 bg-white/5 text-sm text-white placeholder:text-white/25"
              placeholder={fa ? "مثلاً: تماس دندان ۳۶ با مجاور کمتر شود" : "e.g. reduce the contact of tooth 36"}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={revisionNote.trim().length < 3 || busy !== null}
                onClick={() =>
                  send({ revision: revisionNote }, "revision", fa ? "درخواست اصلاح برای طراح ارسال شد." : "Change request sent.")
                }
                className="rounded-full bg-orange-500 font-bold text-white hover:bg-orange-400"
              >
                {busy === "revision" ? <Loader2 className="h-4 w-4 animate-spin" /> : fa ? "ارسال درخواست اصلاح" : "Send request"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setRevisionOpen(false)} className="text-white/50 hover:text-white">
                {fa ? "انصراف" : "Cancel"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
