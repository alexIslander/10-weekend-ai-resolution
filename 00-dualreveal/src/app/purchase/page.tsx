import { PurchaseClient } from "./PurchaseClient";
import { getQuestionSetFlow } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

export default async function PurchasePage() {
  const questionSetFlow = await getQuestionSetFlow();
  return <PurchaseClient questionSetFlow={questionSetFlow} />;
}
