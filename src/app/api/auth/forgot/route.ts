import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api";

/**
 * "Forgot password": there is no e-mail service yet, so this files a request for the admin
 * (shown in the admin panel's Inquiries and Labs tabs), who then sets a temporary password.
 * The answer is always the same, so nobody can use this form to find out which e-mails are registered.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = String(body?.email ?? "").trim().toLowerCase();
    const phone = body?.phone ? String(body.phone).trim().slice(0, 30) : null;
    if (!email || email.length > 200 || !email.includes("@")) return jsonError("MISSING_FIELDS");

    const user = await db.user.findUnique({ where: { email } });
    if (user && user.role === "LAB" && user.active) {
      const since = new Date(Date.now() - 24 * 3600 * 1000);
      const already = await db.inquiry.findFirst({
        where: { email, topic: "PASSWORD_RESET", read: false, createdAt: { gte: since } },
      });
      if (!already) {
        await db.inquiry.create({
          data: {
            name: user.name,
            email,
            phone: phone || user.phone || null,
            topic: "PASSWORD_RESET",
            message: "درخواست بازیابی رمز عبور از صفحه‌ی ورود. لطفاً یک رمز موقت تنظیم و به کاربر اطلاع دهید.",
          },
        });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
