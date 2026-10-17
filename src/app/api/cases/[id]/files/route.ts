import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { sanitizeFiles, type CleanFile } from "@/lib/files";
import { logEvent } from "@/lib/case-utils";
import { handleApiError, jsonError } from "@/lib/api";

const MAX_CASE_FILES = 100;

/**
 * A lab adds more files (or links) to a case it already submitted.
 * The designer and the admin see them on the case; the admin also gets a chat message.
 * Body: { files: [...] }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return jsonError("UNAUTHORIZED", 401);
    const { id } = await params;
    const kase = await db.case.findUnique({ where: { id } });
    if (!kase || kase.userId !== user.id || user.role !== "LAB") return jsonError("NOT_FOUND", 404);
    if (kase.status === "CANCELLED") return jsonError("INVALID_STATE");

    const body = await req.json().catch(() => null);
    const incoming = sanitizeFiles(body?.files);
    if (incoming.length === 0) return jsonError("NO_FILES");

    let existing: CleanFile[] = [];
    try {
      const parsed = JSON.parse(kase.files);
      if (Array.isArray(parsed)) existing = parsed;
    } catch {
      /* start from an empty list */
    }
    const known = new Set(existing.map((f) => f.path));
    const fresh = incoming.filter((f) => !known.has(f.path));
    if (fresh.length === 0) return NextResponse.json({ ok: true, added: 0 });
    if (existing.length + fresh.length > MAX_CASE_FILES) return jsonError("TOO_MANY_FILES");

    await db.case.update({ where: { id }, data: { files: JSON.stringify([...existing, ...fresh]) } });
    const names = fresh.map((f) => f.name).join("، ").slice(0, 300);
    await logEvent(id, "FILES_ADDED", user, names);
    await db.caseMessage.create({
      data: { caseId: id, fromAdmin: false, body: `📎 ${fresh.length} فایل جدید به کیس اضافه شد: ${names}` },
    });
    return NextResponse.json({ ok: true, added: fresh.length });
  } catch (e) {
    return handleApiError(e);
  }
}
