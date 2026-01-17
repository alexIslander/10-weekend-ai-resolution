import Link from "next/link";
import { Card } from "@/components/Card";
import { getDataStore } from "@/lib/data";

export default async function RevealPage({
  params
}: {
  params: { id: string };
}) {
  const store = getDataStore();
  const reveal = await store.getRevealById(params.id);

  if (!reveal) {
    return (
      <Card className="space-y-3">
        <h1 className="text-2xl font-semibold text-navy">Reveal not found</h1>
        <p className="text-sm text-navy/70">
          This reveal link is invalid or has expired.
        </p>
        <Link href="/" className="btn-secondary w-fit">
          Return home
        </Link>
      </Card>
    );
  }

  if (reveal.status !== "completed") {
    return (
      <Card className="space-y-3">
        <h1 className="text-2xl font-semibold text-navy">Reveal pending</h1>
        <p className="text-sm text-navy/70">
          The quiz has not been completed yet.
        </p>
        <Link href={`/dashboard/${reveal.id}`} className="btn-secondary w-fit">
          Back to dashboard
        </Link>
      </Card>
    );
  }

  const [answers, questions] = await Promise.all([
    store.listAnswers(reveal.id),
    store.listQuestions()
  ]);

  const answerMap = new Map(answers.map((answer) => [answer.questionId, answer]));

  return (
    <div className="space-y-8">
      <Card className="space-y-3">
        <p className="kicker">Reveal</p>
        <h1 className="text-3xl font-semibold text-navy">
          {reveal.name || "Your reveal"}
        </h1>
        <p className="text-sm text-navy/70">
          Completed by {reveal.respondentName || "your partner"}.
        </p>
      </Card>

      <div className="grid gap-6">
        {questions.map((question) => (
          <Card key={question.id} className="space-y-3">
            <h2 className="text-lg font-semibold text-navy">{question.prompt}</h2>
            <p className="text-sm text-navy/70">
              {answerMap.get(question.id)?.response ?? "No response."}
            </p>
          </Card>
        ))}
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-navy/70">
          Ready to create another reveal?
        </p>
        <Link href="/purchase" className="btn-primary">
          Start a new one
        </Link>
      </Card>
    </div>
  );
}
