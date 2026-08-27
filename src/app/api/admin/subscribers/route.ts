import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api";

export async function GET() {
  try {
    await requireAdmin();
    const subscribers = await db.subscriber.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ subscribers });
  } catch (e) {
    return handleApiError(e);
  }
}
