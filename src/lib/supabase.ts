import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client for the portfolio's content (projects, experience, …) and
 * the admin login. Configured from .env.local:
 *   VITE_SUPABASE_URL=https://<project>.supabase.co
 *   VITE_SUPABASE_ANON_KEY=<anon / publishable key>
 * The anon key is meant to be public; Row Level Security (supabase/schema.sql)
 * makes the data read-only for visitors and writable only by the admin.
 * Never put the service_role key here: it bypasses those rules.
 *
 * `supabase` is null when the env vars are missing, so the site keeps working
 * on the bundled data in data.ts.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;
