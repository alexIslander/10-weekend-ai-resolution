import { NextResponse, type NextRequest } from "next/server";
import { getDataStore } from "@/lib/data";
import { requireAdmin } from "@/lib/admin";

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  const store = getDataStore();
  const questions = await store.resetQuestions();
  await store.logAdminAction(
    "questions_reset",
    { count: questions.length },
    admin.userId ?? null
  );
  return NextResponse.json({ questions });
}
