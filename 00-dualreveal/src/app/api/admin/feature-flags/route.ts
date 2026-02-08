import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getDataStore } from "@/lib/data";
import { requireAdmin } from "@/lib/admin";

const payloadSchema = z.object({
  key: z.string().min(2).max(64),
  enabled: z.boolean(),
  config: z.record(z.unknown()).optional()
});

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload." },
      { status: 400 }
    );
  }

  const store = getDataStore();
  const flag = await store.upsertFeatureFlag(
    parsed.data.key,
    parsed.data.enabled,
    parsed.data.config ?? {}
  );
  await store.logAdminAction(
    "feature_flag_updated",
    { key: flag.key, enabled: flag.enabled, config: flag.config },
    admin.userId ?? null
  );
  return NextResponse.json({ flag });
}

export async function GET(request: NextRequest) {
  await requireAdmin(request);
  const url = new URL(request.url);
  const key = url.searchParams.get("key") ?? "campaign_discount";
  const store = getDataStore();
  const flag = await store.getFeatureFlag(key);
  return NextResponse.json({ flag });
}
