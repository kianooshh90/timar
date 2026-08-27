import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import crypto from "crypto";

export const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

export const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

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
  path: string; // public URL path e.g. /uploads/2024/abc.stl
  name: string; // original filename
  size: number;
}

/**
 * Streams a raw request body to disk (memory-efficient for 200MB files).
 * Returns public path + original name + size.
 */
export async function streamUpload(
  body: ReadableStream<Uint8Array> | null,
  originalName: string,
  subdir: string
): Promise<SavedFile> {
  if (!body) throw new Error("EMPTY_BODY");
  const dir = path.join(UPLOAD_ROOT, subdir);
  await mkdir(dir, { recursive: true });
  const id = crypto.randomBytes(12).toString("hex");
  const ext = safeExt(originalName);
  const filename = `${Date.now()}-${id}${ext}`;
  const fullPath = path.join(dir, filename);
  await pipeline(Readable.fromWeb(body as never), createWriteStream(fullPath));
  const stat = await import("fs").then((fs) => fs.promises.stat(fullPath));
  if (stat.size > MAX_FILE_SIZE) {
    await import("fs").then((fs) => fs.promises.unlink(fullPath));
    throw new Error("FILE_TOO_LARGE");
  }
  return {
    path: `/uploads/${subdir}/${filename}`,
    name: originalName,
    size: stat.size,
  };
}

/** Resolve a public /uploads or /samples path to an absolute fs path (safe). */
export function resolvePublicFile(publicPath: string): string | null {
  const normalized = path.posix.normalize(publicPath);
  if (!normalized.startsWith("/uploads/") && !normalized.startsWith("/samples/")) {
    return null;
  }
  const abs = path.join(process.cwd(), "public", normalized);
  if (!abs.startsWith(path.join(process.cwd(), "public"))) return null;
  return abs;
}
