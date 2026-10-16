import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireDesigner } from "@/lib/auth";
import { DESIGNER_CASE_SELECT } from "@/lib/case-utils";
import { computeDesignerStats } from "@/lib/designer-stats";
import { handleApiError } from "@/lib/api";

/** The designer's own cases + performance numbers. The lab's identity and prices are never included. */
export async function GET() {
  try {
    const me = await requireDesigner();
    const cases = await db.case.findMany({
      where: { designerId: me.id },
      orderBy: { updatedAt: "desc" },
      select: DESIGNER_CASE_SELECT,
    });
    return NextResponse.json({ cases, stats: computeDesignerStats(cases) });
  } catch (e) {
    return handleApiError(e);
  }
}
