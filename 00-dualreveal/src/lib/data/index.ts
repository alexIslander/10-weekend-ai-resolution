import { env } from "@/lib/env";
import { memoryStore } from "@/lib/data/memory";
import { supabaseStore } from "@/lib/data/supabase";
import type { DataStore } from "@/lib/data/store";

let store: DataStore | null = null;

export const getDataStore = (): DataStore => {
  if (store) return store;
  const hasSupabase = Boolean(
    (env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL) &&
      env.SUPABASE_SERVICE_ROLE_KEY
  );
  store = hasSupabase ? supabaseStore : memoryStore;
  return store;
};
