import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireDesigner } from "@/lib/auth";
import { sanitizeFiles } from "@/lib/files";
import { logEvent } from "@/lib/case-utils";
import { handleApiError, jsonError } from "@/lib/api";

const WORKABLE = ["RECEIVED", "IN_DESIGN"];

function text(v: unknown, max = 1000): string | null {
  const s = String(v ?? "").trim();
  return s ? s.slice(0, max) : null;
}

function parseFiles(json: string) {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/**
 * Designer's actions on a case assigned to them. Body: { action, ...fields }
 *  START                         begin working (status: In design)
 *  SAVE    { deliveryFiles }     keep the uploaded files as a draft
 *  SUBMIT  { deliveryFiles?, note? }  send the work to the admin for review (status: QC)
 *  NOTE    { note }              internal note for the admin
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireDesigner();
    const { id } = await params;
    const kase = await db.case.findUnique({ where: { id } });
    if (!kase || kase.designerId !== me.id) return jsonError("NOT_FOUND", 404);

    const body = await req.json().catch(() => null);
    const action = String(body?.action ?? "");

    switch (action) {
      case "START": {
        if (!WORKABLE.includes(kase.status)) return jsonError("INVALID_STATE");
        if (kase.status === "RECEIVED") {
          await db.case.update({ where: { id }, data: { status: "IN_DESIGN" } });
          await logEvent(id, "STARTED", me);
        }
        break;
      }

      case "SAVE": {
        if (!WORKABLE.includes(kase.status)) return jsonError("INVALID_STATE");
        const files = sanitizeFiles(body?.deliveryFiles);
        await db.case.update({
          where: { id },
          data: { deliveryFiles: JSON.stringify(files), status: "IN_DESIGN" },
        });
        if (kase.status === "RECEIVED") await logEvent(id, "STARTED", me);
        break;
      }

      case "SUBMIT": {
        if (!WORKABLE.includes(kase.status)) return jsonError("INVALID_STATE");
        const files = body?.deliveryFiles !== undefined ? sanitizeFiles(body.deliveryFiles) : parseFiles(kase.deliveryFiles);
        if (files.length === 0) return jsonError("NO_DELIVERY_FILES");
        await db.case.update({
          where: { id },
          data: { deliveryFiles: JSON.stringify(files), status: "QC", submittedAt: new Date() },
        });
        await logEvent(id, "SUBMITTED", me, text(body?.note));
        break;
      }

      case "NOTE": {
        const note = text(body?.note);
        if (!note) return jsonError("NOTE_REQUIRED");
        await logEvent(id, "NOTE", me, note);
        break;
      }

      default:
        return jsonError("INVALID_ACTION");
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
