import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, verifyPassword, publicUser } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";

/** Labs and admins sign in with their e-mail, designers with the username chosen for them by the admin. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, email, password } = body ?? {};
    const id = String(identifier ?? email ?? "").trim().toLowerCase();
    if (!id || !password) return jsonError("MISSING_FIELDS");
    const user = id.includes("@")
      ? await db.user.findUnique({ where: { email: id } })
      : await db.user.findUnique({ where: { username: id } });
    if (!user) return jsonError("INVALID_CREDENTIALS", 401);
    const ok = await verifyPassword(String(password), user.password);
    if (!ok) return jsonError("INVALID_CREDENTIALS", 401);
    if (!user.active) return jsonError("ACCOUNT_DISABLED", 403);
    await createSession(user.id);
    return NextResponse.json({ user: publicUser(user) });
  } catch (e) {
    return handleApiError(e);
  }
}
