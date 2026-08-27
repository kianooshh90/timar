import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api";

export async function GET() {
  try {
    await requireAdmin();
    const services = await db.service.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ services });
  } catch (e) {
    return handleApiError(e);
  }
}
