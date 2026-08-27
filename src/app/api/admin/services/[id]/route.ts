import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.category !== undefined) data.category = String(body.category);
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.nameEn !== undefined) data.nameEn = String(body.nameEn).trim();
    if (body.price !== undefined) data.price = Number(body.price);
    if (body.unit !== undefined) data.unit = String(body.unit);
    if (body.turnaround !== undefined) data.turnaround = String(body.turnaround);
    if (body.active !== undefined) data.active = !!body.active;
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder);
    const service = await db.service.update({ where: { id }, data });
    return NextResponse.json({ ok: true, service });
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
    await db.service.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
