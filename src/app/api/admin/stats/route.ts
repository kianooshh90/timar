import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api";

export async function GET() {
  try {
    await requireAdmin();
    const [cases, inquiries, subscribers, portfolio, labs] = await Promise.all([
      db.case.findMany({ select: { status: true, createdAt: true } }),
      db.inquiry.findMany({ where: { read: false } }),
      db.subscriber.count(),
      db.portfolioItem.count(),
      db.user.count({ where: { role: "LAB" } }),
    ]);
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
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
