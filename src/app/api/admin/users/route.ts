import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api";

/** Registered labs, with a flag for those who asked for a password reset. */
export async function GET() {
  try {
    await requireAdmin();
    const [labs, pending] = await Promise.all([
      db.user.findMany({
        where: { role: "LAB" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          labName: true,
          email: true,
          phone: true,
          city: true,
          active: true,
          createdAt: true,
          _count: { select: { cases: true } },
        },
      }),
      db.inquiry.findMany({ where: { topic: "PASSWORD_RESET", read: false }, select: { email: true } }),
    ]);
    const asked = new Set(pending.map((p) => p.email.toLowerCase()));
    return NextResponse.json({
      users: labs.map((l) => ({
        id: l.id,
        name: l.name,
        labName: l.labName,
        email: l.email,
        phone: l.phone,
        city: l.city,
        active: l.active,
        createdAt: l.createdAt,
        caseCount: l._count.cases,
        resetRequested: asked.has(l.email.toLowerCase()),
      })),
    });
  } catch (e) {
    return handleApiError(e);
  }
}
