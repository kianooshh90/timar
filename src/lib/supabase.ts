import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  // Don't throw at import time (breaks build); routes that need it will fail loudly instead.
  console.warn(
    "[supabase] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing — uploads/downloads will fail."
  );
}

/** Server-only admin client — NEVER import this in client components. Bypasses RLS via service role key. */
export const supabaseAdmin = createClient(url || "", serviceKey || "", {
  auth: { persistSession: false },
});

/** Public bucket: portfolio images/files — served directly, no auth needed to view/download. */
export const PUBLIC_BUCKET = process.env.SUPABASE_PUBLIC_BUCKET || "tdc-public";

/** Private bucket: lab case files + delivery files — only reachable via short-lived signed URLs. */
export const PRIVATE_BUCKET = process.env.SUPABASE_PRIVATE_BUCKET || "tdc-private";
