import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api";

export async function GET() {
  try {
    await requireAdmin();
    const [cases, inquiries, subscribers, portfolio, labs, designers] = await Promise.all([
      db.case.findMany({ select: { status: true, createdAt: true, designerId: true, dueAt: true } }),
      db.inquiry.findMany({ where: { read: false } }),
      db.subscriber.count(),
      db.portfolioItem.count(),
      db.user.count({ where: { role: "LAB" } }),
      db.user.count({ where: { role: "DESIGNER", active: true } }),
    ]);
    const now = Date.now();
    const open = cases.filter((c) => c.status === "RECEIVED" || c.status === "IN_DESIGN" || c.status === "QC");
    const byStatus = {
      RECEIVED: cases.filter((c) => c.status === "RECEIVED").length,
      IN_DESIGN: cases.filter((c) => c.status === "IN_DESIGN").length,
      QC: cases.filter((c) => c.status === "QC").length,
      DELIVERED: cases.filter((c) => c.status === "DELIVERED").length,
      CANCELLED: cases.filter((c) => c.status === "CANCELLED").length,
    };
    return NextResponse.json({
      stats: {
        totalCases: cases.length,
        byStatus,
        unreadInquiries: inquiries.length,
        subscribers,
        portfolioItems: portfolio,
        labs,
        designers,
        unassigned: open.filter((c) => !c.designerId).length, // waiting for the admin to hand them out
        overdue: open.filter((c) => c.dueAt && new Date(c.dueAt).getTime() < now).length,
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
