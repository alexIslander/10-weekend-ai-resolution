import { NextResponse } from "next/server";
import { getDataStore } from "@/lib/data";

export async function GET(request: Request) {
  const store = getDataStore();
  const url = new URL(request.url);
  const setKey = url.searchParams.get("set");
  let questionSetId: string | null | undefined = null;
  if (setKey) {
    const set = await store.getQuestionSetByKey(setKey);
    if (!set) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    questionSetId = set.id;
  }
  const questions = await store.listQuestions(questionSetId);
  return NextResponse.json({ questions });
}
