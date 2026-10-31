import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined;

/** False until .env.local (or the host's env settings) hold a real project URL and publishable key. */
export const supabaseConfigured = Boolean(
  url && key && !url.includes("YOUR-PROJECT") && !key.endsWith("xxxx"),
);

/** Public client for the shop: reads the catalogue and places guest orders. No shopper sign-in. */
export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;
