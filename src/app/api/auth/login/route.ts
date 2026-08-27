import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body ?? {};
    if (!email || !password) return jsonError("MISSING_FIELDS");
    const user = await db.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
    });
    if (!user) return jsonError("INVALID_CREDENTIALS", 401);
    const ok = await verifyPassword(String(password), user.password);
    if (!ok) return jsonError("INVALID_CREDENTIALS", 401);
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
