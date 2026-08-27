import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, labName, phone, city } = body ?? {};
    if (!email || !password || !name) return jsonError("MISSING_FIELDS");
    if (String(password).length < 6) return jsonError("WEAK_PASSWORD");
    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) return jsonError("EMAIL_TAKEN", 409);
    const referralCode = `TDC-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        password: await hashPassword(String(password)),
        name: String(name).trim(),
        labName: labName ? String(labName).trim() : null,
        phone: phone ? String(phone).trim() : null,
        city: city ? String(city).trim() : null,
        role: "LAB",
        referralCode,
      },
    });
    await createSession(user.id);
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        labName: user.labName,
        phone: user.phone,
        city: user.city,
        points: user.points,
        referralCode: user.referralCode,
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
