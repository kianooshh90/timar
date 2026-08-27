"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud, File as FileIcon, X, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTdc, type SavedFile, type Lang } from "./store";
import { fmtBytes } from "./i18n";

interface FileDropProps {
  kind: "portfolio-image" | "portfolio-file" | "case-file" | "delivery-file";
  value: SavedFile[];
  onChange: (files: SavedFile[]) => void;
  accept?: string;
  multiple?: boolean;
  compact?: boolean;
}

/** XHR upload with real progress for 200MB files */
function uploadOne(
  file: File,
  kind: string,
  onProgress: (pct: number) => void
): Promise<SavedFile> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", `/api/upload?kind=${encodeURIComponent(kind)}&name=${encodeURIComponent(file.name)}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(res);
        else reject(new Error(res.error || "UPLOAD_FAILED"));
      } catch {
        reject(new Error("UPLOAD_FAILED"));
      }
    };
    xhr.onerror = () => reject(new Error("NETWORK_ERROR"));
    xhr.send(file);
  });
}

export function FileDrop({ kind, value, onChange, accept, multiple = true, compact = false }: FileDropProps) {
  const lang = useTdc((s) => s.lang);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [jobs, setJobs] = useState<Record<string, { pct: number; status: "up" | "done" | "err"; name: string }>>({});

  const fa = lang === "fa";

  const addFiles = useCallback(
    async (list: FileList | null) => {
      if (!list || list.length === 0) return;
      const files = Array.from(list).slice(0, multiple ? 20 : 1);
      for (const f of files) {
        const key = `${f.name}-${f.size}-${Date.now()}`;
        setJobs((j) => ({ ...j, [key]: { pct: 0, status: "up", name: f.name } }));
        try {
          const saved = await uploadOne(f, kind, (pct) =>
            setJobs((j) => (j[key] ? { ...j, [key]: { ...j[key], pct } } : j))
          );
          setJobs((j) => (j[key] ? { ...j, [key]: { ...j[key], status: "done", pct: 100 } } : j));
          onChange([...(multiple ? value : []), saved]);
          setTimeout(() => setJobs((j) => {
            const next = { ...j };
            delete next[key];
            return next;
          }), 1200);
        } catch {
          setJobs((j) => (j[key] ? { ...j, [key]: { ...j[key], status: "err" } } : j));
        }
      }
    },
    [kind, multiple, onChange, value]
  );

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        aria-label={fa ? "آپلود فایل" : "Upload files"}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`cursor-pointer rounded-2xl border-2 border-dashed transition-colors text-center ${
          compact ? "p-4" : "p-6"
        } ${
          dragging
            ? "border-orange-500 bg-orange-500/10"
            : "border-white/15 hover:border-orange-500/60 hover:bg-white/[0.03]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <UploadCloud className={`mx-auto text-orange-400 ${compact ? "w-6 h-6" : "w-8 h-8"}`} />
        <p className="mt-2 text-sm text-white/70">{fa ? "فایل‌ها را اینجا رها کنید یا کلیک کنید" : "Drop files here or click"}</p>
        <p className="mt-1 text-xs text-white/40">
          {fa ? "حداکثر ۲۰۰ مگابایت برای هر فایل" : "Up to 200MB per file"}
        </p>
      </div>

      {Object.entries(jobs).map(([key, job]) => (
        <div key={key} className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs">
          {job.status === "up" && <Loader2 className="w-4 h-4 animate-spin text-orange-400" />}
          {job.status === "done" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {job.status === "err" && <X className="w-4 h-4 text-red-400" />}
          <span className="flex-1 truncate text-white/80">{job.name}</span>
          <span className="text-white/50 tabular-nums">
            {job.status === "up" ? `${job.pct}%` : job.status === "done" ? (fa ? "✓" : "✓") : (fa ? "خطا" : "Error")}
          </span>
        </div>
      ))}

      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map((f, i) => (
            <li
              key={`${f.path}-${i}`}
              className="flex items-center gap-2 rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2"
            >
              <FileIcon className="w-4 h-4 text-orange-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs truncate text-white/85" dir="ltr">{f.name}</p>
                <p className="text-[10px] text-white/40">{fmtBytes(f.size, lang)}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white/50 hover:text-red-400"
                aria-label={fa ? "حذف" : "Remove"}
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              >
                <X className="w-4 h-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
