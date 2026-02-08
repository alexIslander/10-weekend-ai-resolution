import { NextResponse } from "next/server";
import { z } from "zod";
import { getDataStore } from "@/lib/data";

const payloadSchema = z.object({
  revealId: z.string().min(1),
  source: z.enum(["respondent", "purchaser"]),
  rating: z.boolean(),
  note: z.string().max(280).optional().nullable()
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload." },
      { status: 400 }
    );
  }

  const store = getDataStore();
  const reveal = await store.getRevealById(parsed.data.revealId);
  if (!reveal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const feedback = await store.createFeedback(
    parsed.data.revealId,
    parsed.data.source,
    parsed.data.rating,
    parsed.data.note ?? null
  );

  return NextResponse.json({ feedback });
}
