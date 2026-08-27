import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, topic, message } = await req.json();
    if (!name || !email || !message) return jsonError("MISSING_FIELDS");
    const inquiry = await db.inquiry.create({
      data: {
        name: String(name).trim(),
        email: String(email).trim(),
        phone: phone ? String(phone).trim() : null,
        topic: topic ? String(topic) : "GENERAL",
        message: String(message).trim(),
      },
    });
    return NextResponse.json({ ok: true, id: inquiry.id });
  } catch (e) {
    return handleApiError(e);
  }
}
