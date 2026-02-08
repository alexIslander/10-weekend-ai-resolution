import { NextResponse } from "next/server";
import { z } from "zod";
import { getDataStore } from "@/lib/data";

const payloadSchema = z.object({
  lockId: z.string().min(1)
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
  const existing = await store.getRevealById(params.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.status === "completed") {
    return NextResponse.json(
      { error: "Quiz already completed." },
      { status: 409 }
    );
  }
  if (!existing.questionSetId) {
    return NextResponse.json(
      { error: "Question set not selected yet." },
      { status: 409 }
    );
  }

  const result = await store.startRevealQuiz(params.id, parsed.data.lockId);

  if (result.status === "not_found") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (result.status === "completed") {
    return NextResponse.json(
      { error: "Quiz already completed." },
      { status: 409 }
    );
  }
  if (result.status === "locked") {
    return NextResponse.json(
      { error: "Quiz already in progress." },
      { status: 409 }
    );
  }

  return NextResponse.json({ reveal: result.reveal });
}
