import Link from "next/link";
import { Card } from "@/components/Card";
import { DashboardClient } from "../DashboardClient";
import { getDataStore } from "@/lib/data";
import { isEmailSendEnabled } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
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
          This dashboard link is invalid or has expired.
        </p>
        <Link href="/" className="btn-secondary w-fit">
          Return home
        </Link>
      </Card>
    );
  }

  const questionSets = await store.listQuestionSets();
  const selectedSet =
    questionSets.find((set) => set.id === reveal.questionSetId) ?? null;
  const emailSendEnabled = await isEmailSendEnabled();

  return (
    <DashboardClient
      reveal={reveal}
      questionSet={selectedSet}
      emailSendEnabled={emailSendEnabled}
    />
  );
}
