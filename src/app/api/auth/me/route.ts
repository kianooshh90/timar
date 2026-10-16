import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, hashPassword, verifyPassword, publicUser } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ user: null });
    const caseCount = await db.case.count({ where: { userId: user.id } });
    return NextResponse.json({ user, caseCount });
  } catch (e) {
    return handleApiError(e);
  }
}

/** Update own profile / password */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) return jsonError("UNAUTHORIZED", 401);
    // Designer credentials and profile are managed by the admin only
    if (session.role === "DESIGNER") return jsonError("FORBIDDEN", 403);
    const body = await req.json();
    const data: Record<string, string> = {};
    if (body.name) data.name = String(body.name).trim();
    if (body.labName !== undefined) data.labName = String(body.labName).trim();
    if (body.phone !== undefined) data.phone = String(body.phone).trim();
    if (body.city !== undefined) data.city = String(body.city).trim();
    if (body.newPassword) {
      if (String(body.newPassword).length < 6) return jsonError("WEAK_PASSWORD");
      const user = await db.user.findUnique({ where: { id: session.id } });
      if (!user) return jsonError("UNAUTHORIZED", 401);
      if (!body.currentPassword) return jsonError("CURRENT_PASSWORD_REQUIRED");
      const ok = await verifyPassword(String(body.currentPassword), user.password);
      if (!ok) return jsonError("INVALID_CREDENTIALS", 401);
      data.password = await hashPassword(String(body.newPassword));
    }
    const updated = await db.user.update({
      where: { id: session.id },
      data,
    });
    return NextResponse.json({ user: publicUser(updated) });
  } catch (e) {
    return handleApiError(e);
  }
}
