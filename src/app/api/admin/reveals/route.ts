import { NextResponse, type NextRequest } from "next/server";
import { getDataStore } from "@/lib/data";
import { requireAdmin } from "@/lib/admin";

export async function GET(request: NextRequest) {
  await requireAdmin(request);
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const store = getDataStore();
  const reveals = await store.listReveals({ status });
  return NextResponse.json({ reveals });
}
