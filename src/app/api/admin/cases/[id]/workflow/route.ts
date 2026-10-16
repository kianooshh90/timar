import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logEvent } from "@/lib/case-utils";
import { parseScore } from "@/lib/scoring";
import { handleApiError, jsonError } from "@/lib/api";

const CLOSED = ["DELIVERED", "CANCELLED"];

function text(v: unknown, max = 1000): string | null {
  const s = String(v ?? "").trim();
  return s ? s.slice(0, max) : null;
}

function hasFiles(json: string): boolean {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) && arr.length > 0;
  } catch {
    return false;
  }
}

/**
 * Admin's workflow actions on a case. Body: { action, ...fields }
 *  ASSIGN     { designerId, dueHours?, note? }  give the case to a designer (or move it to another one)
 *  UNASSIGN                                     take it back from the designer
 *  APPROVE                                      work in review is fine: deliver it to the lab
 *  REVISION   { note }                          send it back to the designer (counts as a revision)
 *  SCORE      { score 0..100, note? }           score the designer for this delivered case
 *  NOTE       { note }                          internal note visible to the designer
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const action = String(body?.action ?? "");
    const kase = await db.case.findUnique({ where: { id } });
    if (!kase) return jsonError("NOT_FOUND", 404);

    switch (action) {
      case "ASSIGN": {
        if (CLOSED.includes(kase.status)) return jsonError("INVALID_STATE");
        const designer = await db.user.findUnique({ where: { id: String(body?.designerId ?? "") } });
        if (!designer || designer.role !== "DESIGNER" || !designer.active) return jsonError("INVALID_DESIGNER");
        const hours = Number(body?.dueHours);
        const dueAt = Number.isFinite(hours) && hours > 0 && hours <= 24 * 30 ? new Date(Date.now() + hours * 3_600_000) : null;
        const note = text(body?.note);
        await db.case.update({
          where: { id },
          data: { designerId: designer.id, assignedAt: new Date(), dueAt, designerNote: note },
        });
        await logEvent(id, "ASSIGNED", admin, note ? `${designer.name} — ${note}` : designer.name);
        break;
      }

      case "UNASSIGN": {
        if (!kase.designerId || CLOSED.includes(kase.status)) return jsonError("INVALID_STATE");
        await db.case.update({
          where: { id },
          data: {
            designerId: null,
            assignedAt: null,
            dueAt: null,
            designerNote: null,
            submittedAt: null,
            status: kase.status === "IN_DESIGN" || kase.status === "QC" ? "RECEIVED" : kase.status,
          },
        });
        await logEvent(id, "UNASSIGNED", admin);
        break;
      }

      case "APPROVE": {
        // only work that the designer has sent in for review can be approved here
        // (an admin who did the work personally uses the status dropdown instead)
        if (kase.status !== "QC") return jsonError("INVALID_STATE");
        if (!hasFiles(kase.deliveryFiles)) return jsonError("NO_DELIVERY_FILES");
        await db.case.update({ where: { id }, data: { status: "DELIVERED", deliveredAt: new Date() } });
        await logEvent(id, "DELIVERED", admin);
        break;
      }

      case "REVISION": {
        const note = text(body?.note);
        if (!note || note.length < 3) return jsonError("NOTE_REQUIRED");
        if (kase.status !== "QC" && kase.status !== "DELIVERED") return jsonError("INVALID_STATE");
        await db.case.update({
          where: { id },
          data: { status: "IN_DESIGN", revisionCount: { increment: 1 }, submittedAt: null, deliveredAt: null },
        });
        await logEvent(id, "REVISION", admin, note);
        break;
      }

      case "SCORE": {
        if (kase.status !== "DELIVERED" || !kase.designerId) return jsonError("INVALID_STATE");
        const score = parseScore(body?.score);
        if (score === null) return jsonError("INVALID_SCORE");
        const note = text(body?.note);
        await db.case.update({ where: { id }, data: { score, scoreNote: note, scoredAt: new Date() } });
        await logEvent(id, "SCORED", admin, note ? `${score} — ${note}` : String(score));
        break;
      }

      case "NOTE": {
        const note = text(body?.note);
        if (!note) return jsonError("NOTE_REQUIRED");
        await logEvent(id, "NOTE", admin, note);
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
