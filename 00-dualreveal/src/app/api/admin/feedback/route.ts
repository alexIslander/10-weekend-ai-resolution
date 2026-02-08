import { NextResponse, type NextRequest } from "next/server";
import { getDataStore } from "@/lib/data";
import { requireAdmin } from "@/lib/admin";

export async function GET(request: NextRequest) {
  await requireAdmin(request);
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? 25);
  const store = getDataStore();
  const feedback = await store.listFeedback(Number.isFinite(limit) ? limit : 25);
  return NextResponse.json({ feedback });
}
