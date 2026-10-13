import { TdcApp } from "@/components/tdc/TdcApp";
import { getSiteData } from "@/lib/site-data";

// The page is built on the server and cached on Vercel's CDN, so visitors get the content
// straight away instead of waiting for JavaScript + an API call. Rebuilt at most every 60s,
// and immediately whenever the admin saves a change (see lib/revalidate.ts).
export const revalidate = 60;

export default async function Home() {
  const site = await getSiteData().catch(() => null);
  return <TdcApp initialSite={site} />;
}
