import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { logEvent } from "@/lib/case-utils";
import { handleApiError, jsonError } from "@/lib/api";

/**
 * Feedback from the lab / doctor on a delivered case. Body:
 *  { rating: 1..5, comment? }   satisfaction (used in the designer's score)
 *  { revision: "what to change" }   send the case back to the designer (counts as a revision)
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return jsonError("UNAUTHORIZED", 401);
    const { id } = await params;
    const kase = await db.case.findUnique({ where: { id } });
    if (!kase || kase.userId !== user.id) return jsonError("NOT_FOUND", 404);
    if (kase.status !== "DELIVERED") return jsonError("INVALID_STATE");

    const body = await req.json().catch(() => null);

    if (body?.revision !== undefined) {
      const note = String(body.revision ?? "").trim().slice(0, 1000);
      if (note.length < 3) return jsonError("NOTE_REQUIRED");
      await db.case.update({
        where: { id },
        data: { status: "IN_DESIGN", revisionCount: { increment: 1 }, deliveredAt: null, submittedAt: null },
      });
      await db.caseMessage.create({
        data: { caseId: id, fromAdmin: false, body: `🔁 درخواست اصلاح: ${note}` },
      });
      await logEvent(id, "REVISION", user, note);
      return NextResponse.json({ ok: true });
    }

    const rating = Number(body?.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return jsonError("INVALID_RATING");
    const comment = body?.comment ? String(body.comment).trim().slice(0, 1000) : null;
    await db.case.update({ where: { id }, data: { rating, ratingComment: comment, ratedAt: new Date() } });
    await logEvent(id, "RATED", user, comment ? `${rating}/5 — ${comment}` : `${rating}/5`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
