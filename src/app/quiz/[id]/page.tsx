import Link from "next/link";
import { Card } from "@/components/Card";
import { QuizClient } from "../QuizClient";
import { getDataStore } from "@/lib/data";

export default async function QuizPage({ params }: { params: { id: string } }) {
  const store = getDataStore();
  const reveal = await store.getRevealById(params.id);

  if (!reveal) {
    return (
      <Card className="space-y-3">
        <h1 className="text-2xl font-semibold text-navy">Invalid link</h1>
        <p className="text-sm text-navy/70">
          This quiz link is invalid or has expired.
        </p>
        <Link href="/" className="btn-secondary w-fit">
          Return home
        </Link>
      </Card>
    );
  }

  if (reveal.status === "completed") {
    return (
      <Card className="space-y-3">
        <h1 className="text-2xl font-semibold text-navy">Already completed</h1>
        <p className="text-sm text-navy/70">
          This reveal has already been submitted. Thank you!
        </p>
      </Card>
    );
  }

  if (!reveal.questionSetId) {
    return (
      <Card className="space-y-3">
        <h1 className="text-2xl font-semibold text-navy">Quiz not ready</h1>
        <p className="text-sm text-navy/70">
          The question set has not been selected yet.
        </p>
      </Card>
    );
  }

  const questions = await store.listQuestions(reveal.questionSetId);

  return <QuizClient reveal={reveal} questions={questions} />;
}
