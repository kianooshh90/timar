import { db } from "@/lib/db";
import type { SiteData } from "@/components/tdc/store";

/** Public site bundle: settings + active services + published portfolio. Shared by the home page and /api/site. */
export async function getSiteData(): Promise<SiteData> {
  const [settingsRows, services, portfolio] = await Promise.all([
    db.siteSetting.findMany(),
    db.service.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    db.portfolioItem.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  const settings: Record<string, string> = {};
  for (const row of settingsRows) settings[row.key] = row.value;
  // JSON round-trip: dates become strings, exactly like the API response (safe to pass to client components)
  return JSON.parse(JSON.stringify({ settings, services, portfolio })) as SiteData;
}
