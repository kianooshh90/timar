import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    const body = (await req.json()) as Record<string, unknown>;
    for (const [key, value] of Object.entries(body)) {
      await db.siteSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }
    return NextResponse.json({ ok: true, saved: Object.keys(body).length });
  } catch (e) {
    return handleApiError(e);
  }
}
