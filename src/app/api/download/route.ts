import { NextRequest, NextResponse } from "next/server";
import { resolveDownloadUrl } from "@/lib/upload";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/api";

export const runtime = "nodejs";

/** Redirects to the real file location. GET /api/download?p=<path>&name=<original name>&item=<portfolioId> */
export async function GET(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams.get("p") || "";
    const name = req.nextUrl.searchParams.get("name") || undefined;
    const itemId = req.nextUrl.searchParams.get("item");
    if (!p) return jsonError("INVALID_PATH", 400);

    const url = await resolveDownloadUrl(decodeURIComponent(p), name ? decodeURIComponent(name) : undefined);
    if (!url) return jsonError("NOT_FOUND", 404);

    if (itemId) {
      await db.portfolioItem
        .update({ where: { id: itemId }, data: { downloads: { increment: 1 } } })
        .catch(() => null);
    }

    return NextResponse.redirect(url);
  } catch {
    return jsonError("DOWNLOAD_FAILED", 500);
  }
}
