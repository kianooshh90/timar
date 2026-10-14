"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud, File as FileIcon, X, CheckCircle2, Loader2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTdc, isLinkFile, linkHost, type SavedFile, type Lang } from "./store";
import { fmtBytes } from "./i18n";

interface FileDropProps {
  kind: "portfolio-image" | "portfolio-file" | "case-file" | "delivery-file";
  value: SavedFile[];
  onChange: (files: SavedFile[]) => void;
  accept?: string;
  multiple?: boolean;
  compact?: boolean;
  /** Let the user add an external link (Google Drive, Telegram...) instead of uploading. Default: on, except for images. */
  allowLink?: boolean;
}

/** Accepts "drive.google.com/..." or "https://..."; only public https links are allowed. */
function parseHttpsUrl(input: string): URL | null {
  let raw = input.trim();
  if (!raw || raw.length > 2000 || /\s/.test(raw)) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(raw)) raw = "https://" + raw;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" || u.username || u.password) return null;
    if (!u.hostname.includes(".") || u.hostname.includes(":") || u.hostname.includes("[")) return null;
    if (/^\d+\.\d+\.\d+\.\d+$/.test(u.hostname)) return null;
    return u;
  } catch {
    return null;
  }
}

/** Max size per file. Supabase's free plan allows 50MB; set NEXT_PUBLIC_MAX_UPLOAD_MB on Vercel after upgrading. */
const MAX_MB = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB) || 50;
const MAX_BYTES = MAX_MB * 1024 * 1024;
const MAX_ATTEMPTS = 3;
const STALL_MS = 60_000; // no bytes sent for 60s => treat the connection as dead and retry

class UploadError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

const RETRYABLE = new Set(["NETWORK", "STALLED"]);

/** Step 2: raw PUT straight to Supabase Storage, with real progress and stall detection. */
function putToSignedUrl(file: File, uploadUrl: string, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let lastProgress = Date.now();
    let settled = false;
    let watchdog: ReturnType<typeof setInterval> | undefined;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      if (watchdog) clearInterval(watchdog);
      fn();
    };

    watchdog = setInterval(() => {
      if (Date.now() - lastProgress > STALL_MS) {
        finish(() => reject(new UploadError("STALLED")));
        xhr.abort();
      }
    }, 3000);

    xhr.open("PUT", uploadUrl);
    xhr.upload.onprogress = (e) => {
      lastProgress = Date.now();
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      finish(() => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new UploadError(xhr.status === 413 ? "TOO_LARGE" : `HTTP_${xhr.status}`));
      });
    xhr.onerror = () => finish(() => reject(new UploadError("NETWORK")));
    xhr.onabort = () => finish(() => reject(new UploadError("STALLED")));
    xhr.send(file);
  });
}

/**
 * Two-step upload, retried automatically on network drops:
 * 1) ask our API for a signed Supabase Storage upload URL (small JSON request)
 * 2) PUT the file bytes directly to Supabase (never passes through our server/Vercel function)
 */
async function uploadOne(
  file: File,
  kind: string,
  onProgress: (pct: number) => void,
  onRetry: (attempt: number) => void
): Promise<SavedFile> {
  if (file.size > MAX_BYTES) throw new UploadError("TOO_LARGE");

  for (let attempt = 1; ; attempt++) {
    try {
      const signRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, name: file.name, size: file.size }),
      });
      const signData = await signRes.json().catch(() => ({}));
      if (!signRes.ok) {
        throw new UploadError(
          signRes.status === 401 ? "UNAUTHORIZED" : signRes.status === 413 ? "TOO_LARGE" : "SIGN_FAILED"
        );
      }
      await putToSignedUrl(file, signData.uploadUrl, onProgress);
      return { path: signData.finalPath, name: file.name, size: file.size };
    } catch (e) {
      // fetch() itself throws a TypeError when the network is down
      const err = e instanceof UploadError ? e : new UploadError("NETWORK");
      if (!RETRYABLE.has(err.code) || attempt >= MAX_ATTEMPTS) throw err;
      onRetry(attempt);
      onProgress(0);
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
}

function errorText(code: string, fa: boolean): string {
  switch (code) {
    case "TOO_LARGE":
      return fa
        ? `حجم فایل بیشتر از حد مجاز (${MAX_MB} مگابایت) است. آن را زیپ کنید یا به‌جای آپلود، لینکش را اضافه کنید.`
        : `File is larger than the ${MAX_MB}MB limit. Zip it, or add a link instead of uploading.`;
    case "NETWORK":
    case "STALLED":
      return fa
        ? "اتصال اینترنت قطع یا خیلی کند شد (۳ بار تلاش شد). دوباره امتحان کنید یا لینک فایل را اضافه کنید."
        : "Connection dropped or stalled (tried 3 times). Try again, or add a link to the file instead.";
    case "UNAUTHORIZED":
      return fa ? "نشست شما تمام شده است؛ دوباره وارد شوید." : "Your session expired; please sign in again.";
    default:
      return fa ? `آپلود ناموفق بود (کد: ${code}).` : `Upload failed (code: ${code}).`;
  }
}

type Job = { pct: number; status: "up" | "done" | "err"; name: string; size: number; retry: number; msg?: string };

export function FileDrop({ kind, value, onChange, accept, multiple = true, compact = false, allowLink }: FileDropProps) {
  const lang = useTdc((s) => s.lang);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [jobs, setJobs] = useState<Record<string, Job>>({});
  const filesRef = useRef<Record<string, File>>({});

  // Always-current list, so several files uploaded in one go don't overwrite each other.
  const valueRef = useRef<SavedFile[]>(value);
  valueRef.current = value;

  const fa = lang === "fa";

  // --- "add a link instead of uploading" ---
  const linksEnabled = allowLink ?? kind !== "portfolio-image";
  const [showLink, setShowLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkNote, setLinkNote] = useState("");
  const [linkErr, setLinkErr] = useState("");

  const addLink = () => {
    const u = parseHttpsUrl(linkUrl);
    if (!u) {
      setLinkErr(fa ? "لینک معتبر نیست. باید یک آدرس https مثل لینک Google Drive یا تلگرام باشد." : "Invalid link. It must be an https address, e.g. a Google Drive or Telegram link.");
      return;
    }
    const entry: SavedFile = { path: u.href, name: linkNote.trim() || linkHost(u.href), size: 0, link: true };
    const next = [...(multiple ? valueRef.current : []), entry];
    valueRef.current = next;
    onChange(next);
    setLinkUrl("");
    setLinkNote("");
    setLinkErr("");
    setShowLink(false);
  };

  const patchJob = (key: string, patch: Partial<Job>) =>
    setJobs((j) => (j[key] ? { ...j, [key]: { ...j[key], ...patch } } : j));

  const runJob = useCallback(
    async (key: string) => {
      const f = filesRef.current[key];
      if (!f) return;
      patchJob(key, { status: "up", pct: 0, retry: 0, msg: undefined });
      try {
        const saved = await uploadOne(
          f,
          kind,
          (pct) => patchJob(key, { pct }),
          (attempt) => patchJob(key, { retry: attempt })
        );
        patchJob(key, { status: "done", pct: 100 });
        const next = [...(multiple ? valueRef.current : []), saved];
        valueRef.current = next;
        onChange(next);
        delete filesRef.current[key];
        setTimeout(
          () =>
            setJobs((j) => {
              const copy = { ...j };
              delete copy[key];
              return copy;
            }),
          1200
        );
      } catch (e) {
        const code = e instanceof UploadError ? e.code : "UPLOAD_FAILED";
        patchJob(key, { status: "err", msg: errorText(code, fa) });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kind, multiple, onChange, fa]
  );

  const addFiles = useCallback(
    async (list: FileList | null) => {
      if (!list || list.length === 0) return;
      const files = Array.from(list).slice(0, multiple ? 20 : 1);
      const keys: string[] = [];
      for (const f of files) {
        const key = `${f.name}-${f.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        filesRef.current[key] = f;
        keys.push(key);
        setJobs((j) => ({ ...j, [key]: { pct: 0, status: "up", name: f.name, size: f.size, retry: 0 } }));
      }
      for (const key of keys) await runJob(key);
    },
    [multiple, runJob]
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
          {fa ? `حداکثر ${MAX_MB.toLocaleString("fa-IR")} مگابایت برای هر فایل` : `Up to ${MAX_MB}MB per file`}
        </p>
      </div>

      {linksEnabled && (
        <div>
          {!showLink ? (
            <button
              type="button"
              onClick={() => setShowLink(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/60 transition hover:border-teal-400/40 hover:text-teal-300"
            >
              <Link2 className="h-3.5 w-3.5 shrink-0" />
              {fa
                ? "فایل خیلی بزرگ است یا آپلود کند است؟ به‌جای آپلود، لینک فایل را اضافه کنید"
                : "File too large or upload too slow? Add a link instead"}
            </button>
          ) : (
            <div className="space-y-2 rounded-xl border border-teal-400/25 bg-teal-500/[0.05] p-3">
              <p className="text-[11px] leading-5 text-white/60">
                {fa
                  ? "فایل را در Google Drive، تلگرام، WeTransfer، Dropbox و... بگذارید و لینکش را اینجا بچسبانید. دسترسی لینک باید روی «هر کسی که لینک را دارد» باشد."
                  : "Put the file on Google Drive, Telegram, WeTransfer, Dropbox, etc. and paste its link here. Link access must be set to “anyone with the link”."}
              </p>
              <Input
                dir="ltr"
                value={linkUrl}
                onChange={(e) => {
                  setLinkUrl(e.target.value);
                  setLinkErr("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLink();
                  }
                }}
                placeholder="https://drive.google.com/..."
                className="h-9 rounded-lg border-white/15 bg-white/5 text-xs text-white"
              />
              <Input
                value={linkNote}
                maxLength={120}
                onChange={(e) => setLinkNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLink();
                  }
                }}
                placeholder={fa ? "توضیح یا رمز فایل (اختیاری)" : "Note or file password (optional)"}
                className="h-9 rounded-lg border-white/15 bg-white/5 text-xs text-white"
              />
              {linkErr && <p className="text-[11px] text-red-300">{linkErr}</p>}
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={addLink}
                  className="h-8 rounded-full bg-teal-500 text-xs font-bold text-white hover:bg-teal-400"
                >
                  <Link2 className="me-1 h-3.5 w-3.5" />
                  {fa ? "افزودن لینک" : "Add link"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowLink(false);
                    setLinkErr("");
                  }}
                  className="h-8 text-xs text-white/50 hover:text-white"
                >
                  {fa ? "انصراف" : "Cancel"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {Object.entries(jobs).map(([key, job]) => (
        <div key={key} className="rounded-lg bg-white/5 px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            {job.status === "up" && <Loader2 className="w-4 h-4 animate-spin text-orange-400" />}
            {job.status === "done" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {job.status === "err" && <X className="w-4 h-4 text-red-400" />}
            <span className="flex-1 truncate text-white/80" dir="ltr">{job.name}</span>
            <span className="text-white/50 tabular-nums">
              {job.status === "up"
                ? `${job.pct}%`
                : job.status === "done"
                ? "✓"
                : fa
                ? "ناموفق"
                : "Failed"}
            </span>
          </div>
          {job.status === "up" && (
            <div className="mt-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${job.pct}%` }} />
              </div>
              <p className="mt-1 text-[10px] text-white/40">
                {fmtBytes(job.size, lang)}
                {job.retry > 0 &&
                  ` · ${fa ? `اتصال ضعیف بود، تلاش مجدد (${job.retry + 1} از ${MAX_ATTEMPTS})…` : `weak connection, retrying (${job.retry + 1}/${MAX_ATTEMPTS})…`}`}
              </p>
            </div>
          )}
          {job.status === "err" && (
            <div className="mt-2 space-y-2">
              <p className="text-[11px] leading-5 text-red-300/90">{job.msg}</p>
              <div className="flex flex-wrap gap-2">
                {linksEnabled && (
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 bg-teal-500 text-xs font-bold text-white hover:bg-teal-400"
                    onClick={() => setShowLink(true)}
                  >
                    <Link2 className="me-1 h-3 w-3" />
                    {fa ? "افزودن به‌صورت لینک" : "Add as link"}
                  </Button>
                )}
                {filesRef.current[key] && job.size <= MAX_BYTES && (
                  <Button type="button" size="sm" variant="outline" className="h-7 border-white/20 bg-white/5 text-xs text-white hover:bg-white/10" onClick={() => runJob(key)}>
                    {fa ? "تلاش مجدد" : "Retry"}
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-white/50 hover:text-white"
                  onClick={() => {
                    delete filesRef.current[key];
                    setJobs((j) => {
                      const copy = { ...j };
                      delete copy[key];
                      return copy;
                    });
                  }}
                >
                  {fa ? "بستن" : "Dismiss"}
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}

      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map((f, i) => (
            <li
              key={`${f.path}-${i}`}
              className="flex items-center gap-2 rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2"
            >
              {isLinkFile(f) ? (
                <Link2 className="w-4 h-4 text-teal-400 shrink-0" />
              ) : (
                <FileIcon className="w-4 h-4 text-orange-400 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs truncate text-white/85" dir={isLinkFile(f) ? "auto" : "ltr"}>{f.name}</p>
                <p className="text-[10px] text-white/40" dir="ltr">
                  {isLinkFile(f) ? `${fa ? "لینک" : "Link"} · ${linkHost(f.path)}` : fmtBytes(f.size, lang)}
                </p>
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
