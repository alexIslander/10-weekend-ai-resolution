"use client";

import Link from "next/link";
import { Card } from "@/components/Card";
import { useRevealStore } from "@/store/revealStore";

export default function PurchaseSuccessPage() {
  const { lastRevealId } = useRevealStore();
  return (
    <Card className="space-y-3">
      <p className="kicker">Success</p>
      <h1 className="text-2xl font-semibold text-navy">
        Your reveal is ready.
      </h1>
      <p className="text-sm text-navy/70">
        Payments are not enabled yet. For now, jump back to your dashboard.
      </p>
      {lastRevealId ? (
        <Link href={`/dashboard/${lastRevealId}`} className="btn-primary">
          Go to dashboard
        </Link>
      ) : (
        <Link href="/purchase" className="btn-secondary w-fit">
          Start again
        </Link>
      )}
    </Card>
  );
}
