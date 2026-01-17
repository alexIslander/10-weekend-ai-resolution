import { NextResponse } from "next/server";
import { getDataStore } from "@/lib/data";

export async function GET() {
  const store = getDataStore();
  const questions = await store.listQuestions();
  return NextResponse.json({ questions });
}
