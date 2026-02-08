import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getDataStore } from "@/lib/data";
import { requireAdmin } from "@/lib/admin";

const payloadSchema = z.object({
  questions: z.array(
    z.object({
      id: z.string().min(1),
      prompt: z.string().min(1).max(280)
    })
  )
});

export async function PUT(request: NextRequest) {
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
  await store.updateQuestions(parsed.data.questions);
  await store.logAdminAction(
    "questions_updated",
    { count: parsed.data.questions.length },
    admin.userId ?? null
  );
  return NextResponse.json({ ok: true });
}
