import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sanitizeFiles } from "@/lib/files";
import { logEvent } from "@/lib/case-utils";
import { handleApiError, jsonError } from "@/lib/api";

const STATUSES = ["RECEIVED", "IN_DESIGN", "QC", "DELIVERED", "CANCELLED"];

/** Full case for the admin: lab, designer, messages and the activity log. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const kase = await db.case.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, labName: true, email: true, phone: true } },
        designer: { select: { id: true, name: true, username: true } },
        messages: { orderBy: { createdAt: "asc" } },
        events: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!kase) return jsonError("NOT_FOUND", 404);
    return NextResponse.json({ case: kase });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const before = await db.case.findUnique({ where: { id }, select: { status: true } });
    if (!before) return jsonError("NOT_FOUND", 404);

    const data: Record<string, unknown> = {};
    if (body.status !== undefined) {
      if (!STATUSES.includes(body.status)) return jsonError("INVALID_STATUS");
      data.status = body.status;
      if (body.status === "DELIVERED" && before.status !== "DELIVERED") data.deliveredAt = new Date();
      if (body.status !== "DELIVERED" && before.status === "DELIVERED") data.deliveredAt = null;
    }
    if (body.adminNote !== undefined) data.adminNote = String(body.adminNote).trim() || null;
    if (body.price !== undefined) data.price = body.price === null ? null : Number(body.price);
    if (body.deliveryFiles !== undefined) data.deliveryFiles = JSON.stringify(sanitizeFiles(body.deliveryFiles));
    const kase = await db.case.update({ where: { id }, data });
    if (data.status && data.status !== before.status) {
      await logEvent(id, "STATUS", admin, `${before.status} → ${String(data.status)}`);
    }
    return NextResponse.json({ ok: true, case: kase });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await db.caseMessage.deleteMany({ where: { caseId: id } });
    await db.case.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
