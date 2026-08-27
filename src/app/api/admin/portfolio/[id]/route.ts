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
    const existing = await db.portfolioItem.findUnique({ where: { id } });
    if (!existing) return jsonError("NOT_FOUND", 404);
    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = String(body.title).trim();
    if (body.titleEn !== undefined) data.titleEn = String(body.titleEn).trim() || null;
    if (body.description !== undefined) data.description = String(body.description).trim();
    if (body.descriptionEn !== undefined) data.descriptionEn = String(body.descriptionEn).trim() || null;
    if (body.category !== undefined) data.category = String(body.category);
    if (body.badge !== undefined) data.badge = String(body.badge).trim() || null;
    if (body.images !== undefined) data.images = JSON.stringify(body.images);
    if (body.files !== undefined) data.files = JSON.stringify(body.files);
    if (body.published !== undefined) data.published = !!body.published;
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder);
    const item = await db.portfolioItem.update({ where: { id }, data });
    return NextResponse.json({ ok: true, item });
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
    await db.portfolioItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
