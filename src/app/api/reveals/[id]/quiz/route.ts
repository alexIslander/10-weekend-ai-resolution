import { NextResponse } from "next/server";
import { z } from "zod";
import { getDataStore } from "@/lib/data";
import { checkRateLimit } from "@/lib/rate-limit";

const payloadSchema = z.object({
  respondentName: z.string().min(1).max(80),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        response: z.string().min(1).max(600)
      })
    )
    .min(1)
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload." },
      { status: 400 }
    );
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const rateKey = `submit-quiz:${ip}`;
  const rate = checkRateLimit(rateKey, 8, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please slow down." },
      { status: 429 }
    );
  }

  const store = getDataStore();
  const reveal = await store.getRevealById(params.id);
  if (!reveal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (reveal.status === "completed") {
    return NextResponse.json(
      { error: "Quiz already completed." },
      { status: 409 }
    );
  }

  const questions = await store.listQuestions();
  const questionIds = new Set(questions.map((question) => question.id));
  const allValid = parsed.data.answers.every((answer) =>
    questionIds.has(answer.questionId)
  );
  if (!allValid) {
    return NextResponse.json(
      { error: "Invalid questions." },
      { status: 400 }
    );
  }

  const updated = await store.completeReveal(
    params.id,
    parsed.data.respondentName,
    parsed.data.answers
  );

  return NextResponse.json({ reveal: updated });
}
