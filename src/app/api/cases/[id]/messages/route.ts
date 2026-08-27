import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";

/** Get messages of a case (owner or admin) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return jsonError("UNAUTHORIZED", 401);
    const { id } = await params;
    const kase = await db.case.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        user: { select: { name: true, labName: true, email: true } },
      },
    });
    if (!kase) return jsonError("NOT_FOUND", 404);
    if (user.role !== "ADMIN" && kase.userId !== user.id) {
      return jsonError("FORBIDDEN", 403);
    }
    return NextResponse.json({ case: kase });
  } catch (e) {
    return handleApiError(e);
  }
}

/** Post a message to a case (owner or admin) */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return jsonError("UNAUTHORIZED", 401);
    const { id } = await params;
    const kase = await db.case.findUnique({ where: { id } });
    if (!kase) return jsonError("NOT_FOUND", 404);
    if (user.role !== "ADMIN" && kase.userId !== user.id) {
      return jsonError("FORBIDDEN", 403);
    }
    const { body } = await req.json();
    if (!body || !String(body).trim()) return jsonError("EMPTY_MESSAGE");
    const message = await db.caseMessage.create({
      data: { caseId: id, fromAdmin: user.role === "ADMIN", body: String(body).trim() },
    });
    return NextResponse.json({ ok: true, message });
  } catch (e) {
    return handleApiError(e);
  }
}
