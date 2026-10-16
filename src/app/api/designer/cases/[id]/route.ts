import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireDesigner } from "@/lib/auth";
import { DESIGNER_CASE_SELECT } from "@/lib/case-utils";
import { handleApiError, jsonError } from "@/lib/api";

/** One of the designer's cases, with its activity log (assignment, notes, revisions...). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireDesigner();
    const { id } = await params;
    const kase = await db.case.findFirst({
      where: { id, designerId: me.id },
      select: { ...DESIGNER_CASE_SELECT, events: { orderBy: { createdAt: "asc" } } },
    });
    if (!kase) return jsonError("NOT_FOUND", 404);
    return NextResponse.json({ case: kase });
  } catch (e) {
    return handleApiError(e);
  }
}
