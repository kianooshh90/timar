import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api";

/** Public site bundle: settings + active services + published portfolio */
export async function GET() {
  try {
    const [settingsRows, services, portfolio] = await Promise.all([
      db.siteSetting.findMany(),
      db.service.findMany({
        where: { active: true },
        orderBy: { sortOrder: "asc" },
      }),
      db.portfolioItem.findMany({
        where: { published: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);
    const settings: Record<string, string> = {};
    for (const row of settingsRows) settings[row.key] = row.value;
    return NextResponse.json(
      { settings, services, portfolio },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    return handleApiError(e);
  }
}
