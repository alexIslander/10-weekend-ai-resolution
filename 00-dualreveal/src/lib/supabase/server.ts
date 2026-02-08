import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

let adminClient: SupabaseClient<Database> | null = null;

export const getSupabaseAdmin = () => {
  const supabaseUrl = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return null;
  if (!adminClient) {
    adminClient = createClient<Database>(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    });
  }
  return adminClient;
};
