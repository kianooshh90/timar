import { NextRequest, NextResponse } from "next/server";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import { resolvePublicFile } from "@/lib/upload";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/api";

export const runtime = "nodejs";

/** Force-download a public file. GET /api/download?p=/uploads/...&item=<portfolioId> */
export async function GET(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams.get("p") || "";
    const itemId = req.nextUrl.searchParams.get("item");
    const abs = resolvePublicFile(decodeURIComponent(p));
    if (!abs) return jsonError("INVALID_PATH", 400);
    const info = await stat(abs).catch(() => null);
    if (!info || !info.isFile()) return jsonError("NOT_FOUND", 404);

    if (itemId) {
      await db.portfolioItem
        .update({ where: { id: itemId }, data: { downloads: { increment: 1 } } })
        .catch(() => null);
    }

    const filename = p.split("/").pop() || "file";
    const stream = Readable.toWeb(createReadStream(abs)) as ReadableStream;
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Content-Length": String(info.size),
      },
    });
  } catch {
    return jsonError("DOWNLOAD_FAILED", 500);
  }
}
