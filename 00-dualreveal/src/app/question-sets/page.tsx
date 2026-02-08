import { Suspense } from "react";
import { QuestionSetClient } from "./QuestionSetClient";

export default function QuestionSetsPage() {
  return (
    <Suspense>
      <QuestionSetClient />
    </Suspense>
  );
}
