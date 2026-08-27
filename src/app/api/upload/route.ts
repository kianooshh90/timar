import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { streamUpload } from "@/lib/upload";

export const runtime = "nodejs";
export const maxDuration = 300;

const KINDS: Record<string, string> = {
  "portfolio-image": "portfolio/images",
  "portfolio-file": "portfolio/files",
  "case-file": "cases",
  "delivery-file": "deliveries",
};

/**
 * Streaming file upload (supports up to 200MB).
 * Client: PUT /api/upload?kind=portfolio-file&name=original.stl
 * Body: raw file bytes. Admin for portfolio kinds; any logged-in user for case-file; admin for delivery-file.
 */
export async function PUT(req: NextRequest) {
  try {
    const kind = req.nextUrl.searchParams.get("kind") || "";
    const name = req.nextUrl.searchParams.get("name") || "file.bin";
    const subdir = KINDS[kind];
    if (!subdir) return jsonError("INVALID_KIND");

    const user = await getSessionUser();
    if (!user) return jsonError("UNAUTHORIZED", 401);
    if ((kind === "portfolio-image" || kind === "portfolio-file" || kind === "delivery-file") && user.role !== "ADMIN") {
      return jsonError("FORBIDDEN", 403);
    }

    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > 200 * 1024 * 1024) return jsonError("FILE_TOO_LARGE", 413);

    const saved = await streamUpload(req.body, decodeURIComponent(name), subdir);
    return NextResponse.json(saved);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UPLOAD_FAILED";
    if (msg === "FILE_TOO_LARGE") return jsonError("FILE_TOO_LARGE", 413);
    return handleApiError(e);
  }
}
