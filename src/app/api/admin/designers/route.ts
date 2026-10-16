import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, hashPassword, normalizeUsername, DESIGNER_EMAIL_DOMAIN } from "@/lib/auth";
import { computeDesignerStats } from "@/lib/designer-stats";
import { handleApiError, jsonError } from "@/lib/api";

/** All designers with their performance numbers. */
export async function GET() {
  try {
    await requireAdmin();
    const [designers, cases] = await Promise.all([
      db.user.findMany({
        where: { role: "DESIGNER" },
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, username: true, phone: true, active: true, createdAt: true },
      }),
      db.case.findMany({
        where: { designerId: { not: null } },
        select: {
          designerId: true,
          status: true,
          assignedAt: true,
          dueAt: true,
          deliveredAt: true,
          revisionCount: true,
          rating: true,
          score: true,
        },
      }),
    ]);
    const byDesigner = new Map<string, typeof cases>();
    for (const c of cases) {
      if (!c.designerId) continue;
      const list = byDesigner.get(c.designerId) ?? [];
      list.push(c);
      byDesigner.set(c.designerId, list);
    }
    return NextResponse.json({
      designers: designers.map((d) => ({ ...d, stats: computeDesignerStats(byDesigner.get(d.id) ?? []) })),
    });
  } catch (e) {
    return handleApiError(e);
  }
}

/** Create a designer account: the admin chooses the username and the password. */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => null);
    const name = String(body?.name ?? "").trim();
    const username = normalizeUsername(body?.username);
    const password = String(body?.password ?? "");
    const phone = body?.phone ? String(body.phone).trim().slice(0, 30) : null;
    if (!name) return jsonError("MISSING_FIELDS");
    if (!username) return jsonError("INVALID_USERNAME");
    if (password.length < 8) return jsonError("WEAK_PASSWORD");

    const email = `${username}@${DESIGNER_EMAIL_DOMAIN}`;
    const taken = await db.user.findFirst({ where: { OR: [{ username }, { email }] } });
    if (taken) return jsonError("USERNAME_TAKEN", 409);

    const designer = await db.user.create({
      data: {
        name,
        username,
        email,
        phone,
        role: "DESIGNER",
        active: true,
        password: await hashPassword(password),
      },
      select: { id: true, name: true, username: true, phone: true, active: true, createdAt: true },
    });
    return NextResponse.json({ ok: true, designer });
  } catch (e) {
    return handleApiError(e);
  }
}
