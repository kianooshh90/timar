import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, hashPassword, normalizeUsername, DESIGNER_EMAIL_DOMAIN } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";

/** Edit a designer: name, phone, username, password, active. Only the admin can change a designer's login. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const target = await db.user.findUnique({ where: { id } });
    if (!target || target.role !== "DESIGNER") return jsonError("NOT_FOUND", 404);

    const body = await req.json().catch(() => null);
    const data: Record<string, unknown> = {};

    if (body?.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) return jsonError("MISSING_FIELDS");
      data.name = name;
    }
    if (body?.phone !== undefined) data.phone = body.phone ? String(body.phone).trim().slice(0, 30) : null;
    if (body?.active !== undefined) data.active = !!body.active;

    if (body?.username !== undefined && String(body.username).trim().toLowerCase() !== target.username) {
      const username = normalizeUsername(body.username);
      if (!username) return jsonError("INVALID_USERNAME");
      const email = `${username}@${DESIGNER_EMAIL_DOMAIN}`;
      const taken = await db.user.findFirst({ where: { OR: [{ username }, { email }], NOT: { id } } });
      if (taken) return jsonError("USERNAME_TAKEN", 409);
      data.username = username;
      data.email = email;
    }
    if (body?.password) {
      if (String(body.password).length < 8) return jsonError("WEAK_PASSWORD");
      data.password = await hashPassword(String(body.password));
    }

    const designer = await db.user.update({
      where: { id },
      data,
      select: { id: true, name: true, username: true, phone: true, active: true, createdAt: true },
    });
    return NextResponse.json({ ok: true, designer });
  } catch (e) {
    return handleApiError(e);
  }
}

/** Delete a designer that never had a case. Otherwise deactivate the account so the history stays intact. */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const target = await db.user.findUnique({ where: { id } });
    if (!target || target.role !== "DESIGNER") return jsonError("NOT_FOUND", 404);
    const count = await db.case.count({ where: { designerId: id } });
    if (count > 0) return jsonError("HAS_CASES", 409);
    await db.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
