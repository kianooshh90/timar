/**
 * Server-side validation of the file lists that clients send (case files, delivery files, portfolio files).
 * Only three kinds of entries are accepted, everything else is dropped:
 *  - files stored by us:  "bucket:folder/name.ext", our Supabase public URL, or a bundled /samples|/images path
 *  - external links:      {link: true, path: "https://..."}  (Google Drive, Telegram, WeTransfer, ...)
 * This also blocks "javascript:" style URLs from ever being stored and later clicked by an admin.
 */
export interface CleanFile {
  path: string;
  name: string;
  size: number;
  link?: boolean;
}

const MAX_FILES = 50;

/** Returns a normalized https URL, or null if the input is not an acceptable public https link. */
export function parseHttpsUrl(input: string): URL | null {
  const raw = input.trim();
  if (!raw || raw.length > 2000 || /\s/.test(raw)) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return null;
    if (u.username || u.password) return null;
    if (!u.hostname.includes(".") || u.hostname.includes(":") || u.hostname.includes("[")) return null;
    if (/^\d+\.\d+\.\d+\.\d+$/.test(u.hostname)) return null;
    return u;
  } catch {
    return null;
  }
}

const PUBLIC_BUCKET = process.env.SUPABASE_PUBLIC_BUCKET || "tdc-public";
const PRIVATE_BUCKET = process.env.SUPABASE_PRIVATE_BUCKET || "tdc-private";

function isStoredPath(path: string): boolean {
  if (path.includes("..")) return false;
  // private/public bucket reference: only OUR two buckets are accepted (so "https:..." can never pass as one)
  const bucketRef = new RegExp(`^(${PUBLIC_BUCKET}|${PRIVATE_BUCKET}):[A-Za-z0-9_\\-./]+$`);
  if (bucketRef.test(path)) return true;
  if (/^\/(samples|images)\/[A-Za-z0-9_\-./]+$/.test(path)) return true; // bundled static files
  const u = parseHttpsUrl(path);
  return !!u && u.hostname.endsWith(".supabase.co") && u.pathname.startsWith("/storage/v1/object/public/");
}

export function sanitizeFiles(input: unknown): CleanFile[] {
  if (!Array.isArray(input)) return [];
  const out: CleanFile[] = [];
  for (const raw of input.slice(0, MAX_FILES)) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const path = typeof r.path === "string" ? r.path.trim() : "";
    const name = typeof r.name === "string" ? r.name.trim().slice(0, 200) : "";
    const size = typeof r.size === "number" && Number.isFinite(r.size) && r.size >= 0 ? r.size : 0;
    if (!path || path.length > 2000) continue;

    if (r.link === true) {
      const u = parseHttpsUrl(path);
      if (!u) continue;
      out.push({ path: u.href, name: name || u.hostname.replace(/^www\./, ""), size: 0, link: true });
    } else if (isStoredPath(path)) {
      out.push({ path, name: name || "file", size });
    }
  }
  return out;
}
