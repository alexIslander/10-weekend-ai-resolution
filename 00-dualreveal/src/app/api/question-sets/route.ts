import { NextResponse } from "next/server";
import { getDataStore } from "@/lib/data";

export async function GET() {
  const store = getDataStore();
  const questionSets = await store.listQuestionSets();
  return NextResponse.json({ questionSets });
}
