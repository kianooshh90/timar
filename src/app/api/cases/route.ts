import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { patientName, toothNumbers, serviceType, notes, files } = body ?? {};
    if (!serviceType) return jsonError("MISSING_FIELDS");
    const code = `TDC-${crypto.randomInt(1000, 9999)}`;
    const existing = await db.case.findUnique({ where: { code } });
    const finalCode = existing
      ? `TDC-${crypto.randomInt(1000, 9999)}`
      : code;
    const kase = await db.case.create({
      data: {
        code: finalCode,
        userId: user.id,
        patientName: patientName ? String(patientName).trim() : null,
        toothNumbers: toothNumbers ? String(toothNumbers).trim() : null,
        serviceType: String(serviceType),
        notes: notes ? String(notes).trim() : null,
        files: JSON.stringify(Array.isArray(files) ? files : []),
      },
    });
    return NextResponse.json({ ok: true, case: kase });
  } catch (e) {
    return handleApiError(e);
  }
}
