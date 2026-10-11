import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";

const STATUSES = ["RECEIVED", "IN_DESIGN", "QC", "DELIVERED", "CANCELLED"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.status !== undefined) {
      if (!STATUSES.includes(body.status)) return jsonError("INVALID_STATUS");
      data.status = body.status;
    }
    if (body.adminNote !== undefined) data.adminNote = String(body.adminNote).trim() || null;
    if (body.price !== undefined) data.price = body.price === null ? null : Number(body.price);
    if (body.deliveryFiles !== undefined) data.deliveryFiles = JSON.stringify(body.deliveryFiles);
    const kase = await db.case.update({ where: { id }, data });
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
