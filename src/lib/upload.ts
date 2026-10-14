import path from "path";
import crypto from "crypto";
import { supabaseAdmin, PUBLIC_BUCKET, PRIVATE_BUCKET } from "@/lib/supabase";

// Per-file limit. Supabase free plan = 50MB; raise via NEXT_PUBLIC_MAX_UPLOAD_MB after upgrading.
export const MAX_FILE_SIZE = (Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB) || 50) * 1024 * 1024;

const EXT_WHITELIST = new Set([
  // images
  ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg",
  // 3d / cad
  ".stl", ".obj", ".ply", ".3mf", ".dxf", ".exr",
  // docs
  ".pdf", ".doc", ".docx", ".txt", ".csv",
  // archives
  ".zip", ".rar", ".7z",
  // dental software projects
  ".sddx", ".dxd", ".dentalproject",
]);

export function safeExt(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (!ext || !EXT_WHITELIST.has(ext)) return ".bin";
  return ext;
}

export interface SavedFile {
  path: string; // stored in DB — either a public URL, or "bucket:storage/path" for private files
  name: string; // original filename
  size: number;
}

const KIND_CONFIG: Record<string, { bucket: string; subdir: string; adminOnly: boolean; isPublic: boolean }> = {
  "portfolio-image": { bucket: PUBLIC_BUCKET, subdir: "portfolio/images", adminOnly: true, isPublic: true },
  "portfolio-file": { bucket: PUBLIC_BUCKET, subdir: "portfolio/files", adminOnly: true, isPublic: true },
  "case-file": { bucket: PRIVATE_BUCKET, subdir: "cases", adminOnly: false, isPublic: false },
  "delivery-file": { bucket: PRIVATE_BUCKET, subdir: "deliveries", adminOnly: true, isPublic: false },
};

export function getKindConfig(kind: string) {
  return KIND_CONFIG[kind] ?? null;
}

export interface SignedUpload {
  uploadUrl: string; // where the browser PUTs the raw file bytes directly (bypasses our server)
  finalPath: string; // value to store as SavedFile.path once the upload succeeds
}

/**
 * Creates a short-lived signed upload URL so the browser can send the file
 * straight to Supabase Storage (needed for files up to 200MB — Vercel serverless
 * functions cap request bodies at a few MB, so the file must never pass through them).
 */
export async function createSignedUpload(kind: string, originalName: string): Promise<SignedUpload> {
  const cfg = getKindConfig(kind);
  if (!cfg) throw new Error("INVALID_KIND");

  const ext = safeExt(originalName);
  const id = crypto.randomBytes(12).toString("hex");
  const storagePath = `${cfg.subdir}/${Date.now()}-${id}${ext}`;

  const { data, error } = await supabaseAdmin.storage.from(cfg.bucket).createSignedUploadUrl(storagePath);
  if (error || !data) throw new Error("SIGN_FAILED");

  const finalPath = cfg.isPublic
    ? supabaseAdmin.storage.from(cfg.bucket).getPublicUrl(storagePath).data.publicUrl
    : `${cfg.bucket}:${storagePath}`;

  return { uploadUrl: data.signedUrl, finalPath };
}

/**
 * Resolves a SavedFile.path into a URL the browser can actually fetch from.
 * - Public-bucket files: the stored value is already a full https URL, return as-is.
 * - Private-bucket files: stored as "bucket:storage/path" — mint a fresh short-lived signed URL.
 * - Legacy local "/uploads/..." or "/samples/..." paths (pre-migration data): resolved as static
 *   files served from /public, since old seed/sample files still ship in the repo.
 */
function isOurPublicUrl(p: string): boolean {
  try {
    const u = new URL(p);
    const own = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : "";
    return u.protocol === "https:" && !!own && u.hostname === own && u.pathname.startsWith("/storage/v1/object/public/");
  } catch {
    return false;
  }
}

export async function resolveDownloadUrl(p: string, downloadName?: string): Promise<string | null> {
  if (/^https?:\/\//.test(p)) return isOurPublicUrl(p) ? p : null; // never redirect to arbitrary sites
  if (p.startsWith("/samples/") || p.startsWith("/images/")) return p; // static repo assets

  const m = p.match(/^([a-zA-Z0-9_-]+):(.+)$/);
  if (!m) return null;
  const [, bucket, storagePath] = m;
  if (bucket !== PUBLIC_BUCKET && bucket !== PRIVATE_BUCKET) return null;

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(storagePath, 60 * 10, downloadName ? { download: downloadName } : undefined);
  if (error || !data) return null;
  return data.signedUrl;
}
