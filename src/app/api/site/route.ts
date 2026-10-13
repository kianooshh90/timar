import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { getSiteData } from "@/lib/site-data";

/** Public site bundle (used by the admin panel to refresh after saving; the home page is server-rendered). */
export async function GET() {
  try {
    const data = await getSiteData();
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return handleApiError(e);
  }
}
