import type { NextRequest } from "next/server";
import { adminEmails, env } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type AdminIdentity = {
  mode: "token" | "supabase";
  userId?: string | null;
};

export const requireAdmin = async (
  request: NextRequest
): Promise<AdminIdentity> => {
  const tokenHeader = request.headers.get("x-admin-token");
  if (env.ADMIN_TOKEN && tokenHeader === env.ADMIN_TOKEN) {
    return { mode: "token" };
  }

  const authHeader = request.headers.get("authorization");
  const accessToken = authHeader?.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "")
    : null;
  if (accessToken) {
    const client = getSupabaseAdmin();
    if (client) {
      const { data, error } = await client.auth.getUser(accessToken);
      if (!error && data.user && data.user.email) {
        if (adminEmails.includes(data.user.email)) {
          return { mode: "supabase", userId: data.user.id };
        }
      }
    }
  }

  throw new Response("Unauthorized", { status: 401 });
};
