import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || !String(email).includes("@")) return jsonError("INVALID_EMAIL");
    const normalized = String(email).trim().toLowerCase();
    await db.subscriber.upsert({
      where: { email: normalized },
      update: {},
      create: { email: normalized },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
