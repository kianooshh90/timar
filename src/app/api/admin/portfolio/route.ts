import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";

export async function GET() {
  try {
    await requireAdmin();
    const items = await db.portfolioItem.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ items });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { title, titleEn, description, descriptionEn, category, badge, images, files, published } = body ?? {};
    if (!title || !description || !category) return jsonError("MISSING_FIELDS");
    const maxSort = await db.portfolioItem.aggregate({ _max: { sortOrder: true } });
    const item = await db.portfolioItem.create({
      data: {
        title: String(title).trim(),
        titleEn: titleEn ? String(titleEn).trim() : null,
        description: String(description).trim(),
        descriptionEn: descriptionEn ? String(descriptionEn).trim() : null,
        category: String(category),
        badge: badge ? String(badge).trim() : null,
        images: JSON.stringify(Array.isArray(images) ? images : []),
        files: JSON.stringify(Array.isArray(files) ? files : []),
        published: published !== false,
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      },
    });
    return NextResponse.json({ ok: true, item });
  } catch (e) {
    return handleApiError(e);
  }
}
