import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { publicCase } from "@/lib/case-utils";
import { handleApiError } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();
    const cases = await db.case.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    return NextResponse.json({ cases: cases.map(publicCase) });
  } catch (e) {
    return handleApiError(e);
  }
}
