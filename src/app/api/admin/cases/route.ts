import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api";

export async function GET() {
  try {
    await requireAdmin();
    const cases = await db.case.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, labName: true, email: true, phone: true } },
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
    return NextResponse.json({ cases });
  } catch (e) {
    return handleApiError(e);
  }
}
