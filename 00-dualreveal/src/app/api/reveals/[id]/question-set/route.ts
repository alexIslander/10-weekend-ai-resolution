import { NextResponse } from "next/server";
import { z } from "zod";
import { getDataStore } from "@/lib/data";

const payloadSchema = z.object({
  questionSetKey: z.string().min(1)
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

  const store = getDataStore();
  const reveal = await store.getRevealById(params.id);
  if (!reveal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (reveal.status === "completed") {
    return NextResponse.json(
      { error: "Reveal already completed." },
      { status: 409 }
    );
  }
  if (reveal.questionSetId) {
    return NextResponse.json(
      { error: "Question set already selected." },
      { status: 409 }
    );
  }

  const set = await store.getQuestionSetByKey(parsed.data.questionSetKey);
  if (!set) {
    return NextResponse.json(
      { error: "Invalid question set." },
      { status: 400 }
    );
  }

  const updated = await store.updateRevealQuestionSet(reveal.id, set.id);
  return NextResponse.json({ reveal: updated, questionSet: set });
}
