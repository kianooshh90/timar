import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidateSite } from "@/lib/revalidate";
import { handleApiError, jsonError } from "@/lib/api";

export async function GET() {
  try {
    await requireAdmin();
    const services = await db.service.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ services });
  } catch (e) {
    return handleApiError(e);
  }
}

/** Create a new tariff (the admin panel's "add service" button posts here). */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => null);
    const { category, name, nameEn, price, unit, turnaround } = body ?? {};
    if (!category || !name) return jsonError("MISSING_FIELDS");
    const maxSort = await db.service.aggregate({ _max: { sortOrder: true } });
    const service = await db.service.create({
      data: {
        category: String(category),
        name: String(name).trim(),
        nameEn: String(nameEn || name).trim(),
        price: Number(price) || 0,
        unit: unit ? String(unit) : "/unit",
        turnaround: turnaround ? String(turnaround) : "۱ تا ۲ ساعت",
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      },
    });
    revalidateSite();
    return NextResponse.json({ ok: true, service });
  } catch (e) {
    return handleApiError(e);
  }
}
