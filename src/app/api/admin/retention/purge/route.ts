import { NextResponse, type NextRequest } from "next/server";
import { getDataStore } from "@/lib/data";
import { requireAdmin } from "@/lib/admin";
import { retentionCutoffIso } from "@/lib/retention";

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  const store = getDataStore();
  const cutoff = retentionCutoffIso();
  const deleted = await store.purgeExpiredReveals(cutoff);
  await store.logAdminAction(
    "retention_purge",
    { cutoff, deleted },
    admin.userId ?? null
  );
  return NextResponse.json({ deleted, cutoff });
}
