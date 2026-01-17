import { NextResponse } from "next/server";
import { z } from "zod";
import { getDataStore } from "@/lib/data";

const payloadSchema = z.object({
  name: z.string().min(1).max(120)
});

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const store = getDataStore();
  const reveal = await store.getRevealById(params.id);
  if (!reveal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const answers = await store.listAnswers(params.id);
  return NextResponse.json({ reveal, answers });
}

export async function PATCH(
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
  const reveal = await store.updateRevealName(params.id, parsed.data.name);
  if (!reveal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ reveal });
}
