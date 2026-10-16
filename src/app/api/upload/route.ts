import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { createSignedUpload, getKindConfig, MAX_FILE_SIZE } from "@/lib/upload";

export const runtime = "nodejs";

/**
 * Step 1 of the upload flow: client asks us for a signed Supabase Storage upload URL.
 * We never touch the file bytes ourselves — the browser PUTs the file directly to
 * the returned uploadUrl in a second request.
 *
 * POST /api/upload   body: { kind, name, size }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const kind = body?.kind as string | undefined;
    const name = body?.name as string | undefined;
    const size = body?.size as number | undefined;

    if (!kind || !name) return jsonError("INVALID_REQUEST");
    const cfg = getKindConfig(kind);
    if (!cfg) return jsonError("INVALID_KIND");
    if (typeof size === "number" && size > MAX_FILE_SIZE) return jsonError("FILE_TOO_LARGE", 413);

    const user = await getSessionUser();
    if (!user) return jsonError("UNAUTHORIZED", 401);
    // portfolio files: admin only. Delivery files: admin or the designers. Case files: labs/admin (not designers).
    const allowed =
      user.role === "ADMIN" ||
      (kind === "delivery-file" && user.role === "DESIGNER") ||
      (!cfg.adminOnly && kind !== "delivery-file" && user.role !== "DESIGNER");
    if (!allowed) return jsonError("FORBIDDEN", 403);

    const signed = await createSignedUpload(kind, name);
    return NextResponse.json(signed);
  } catch (e) {
    return handleApiError(e);
  }
}
