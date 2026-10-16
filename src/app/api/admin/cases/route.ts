import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const designerId = req.nextUrl.searchParams.get("designerId");
    const cases = await db.case.findMany({
      where: designerId ? { designerId } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, labName: true, email: true, phone: true } },
        designer: { select: { id: true, name: true, username: true } },
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
    return NextResponse.json({ cases });
  } catch (e) {
    return handleApiError(e);
  }
}
