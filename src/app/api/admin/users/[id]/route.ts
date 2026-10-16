import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";

/**
 * Admin actions on a lab account:
 *  - { resetPassword: true }  -> sets a random temporary password and returns it (shown once)
 *  - { password: "..." }      -> sets the password the admin typed
 *  - { active: boolean }      -> enable / disable the account
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const target = await db.user.findUnique({ where: { id } });
    if (!target || target.role !== "LAB") return jsonError("NOT_FOUND", 404);

    const body = await req.json().catch(() => null);
    const data: Record<string, unknown> = {};
    let tempPassword: string | null = null;

    if (body?.active !== undefined) data.active = !!body.active;
    if (body?.resetPassword) {
      tempPassword = crypto.randomBytes(6).toString("base64url"); // 8 characters
    } else if (body?.password) {
      if (String(body.password).length < 6) return jsonError("WEAK_PASSWORD");
      tempPassword = String(body.password);
    }
    if (tempPassword) data.password = await hashPassword(tempPassword);
    if (Object.keys(data).length === 0) return jsonError("NOTHING_TO_UPDATE");

    await db.user.update({ where: { id }, data });
    if (tempPassword) {
      // the lab's "forgot password" requests are handled now
      await db.inquiry.updateMany({
        where: { email: target.email, topic: "PASSWORD_RESET", read: false },
        data: { read: true },
      });
    }
    return NextResponse.json({ ok: true, tempPassword: body?.resetPassword ? tempPassword : null });
  } catch (e) {
    return handleApiError(e);
  }
}
