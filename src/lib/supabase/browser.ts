import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

export const getSupabaseBrowserClient = () => {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};
