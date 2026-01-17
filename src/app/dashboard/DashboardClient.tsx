"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { CopyButton } from "@/components/CopyButton";
import { StatusPanel } from "@/components/StatusPanel";
import { getBaseUrl } from "@/lib/base-url";
import type { Reveal } from "@/lib/data/types";

type DashboardClientProps = {
  reveal: Reveal;
};

export function DashboardClient({ reveal }: DashboardClientProps) {
  const router = useRouter();
  const [name, setName] = useState(reveal.name ?? "");
  const [saving, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const magicLink = `${getBaseUrl()}/quiz/${reveal.id}`;

  const handleSave = () => {
    startTransition(async () => {
      setMessage(null);
      const response = await fetch(`/api/reveals/${reveal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      if (!response.ok) {
        setMessage("Could not update the reveal name.");
        return;
      }
      setMessage("Saved.");
      router.refresh();
    });
  };

  return (
    <div className="space-y-8">
      <Card className="space-y-4">
        <p className="kicker">Dashboard</p>
        <h1 className="text-3xl font-semibold text-navy">Your reveal</h1>
        <div className="space-y-2">
          <label
            htmlFor="reveal-name"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-mint-600"
          >
            Reveal name
          </label>
          <input
            id="reveal-name"
            className="input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name this reveal"
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving" : "Save name"}
            </button>
            {message ? <span className="text-xs text-mint-700">{message}</span> : null}
          </div>
        </div>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-navy">Magic link</h2>
          <CopyButton text={magicLink} />
        </div>
        <p className="text-sm text-navy/70 break-all" data-testid="magic-link">
          {magicLink}
        </p>
        <Link href={`/quiz/${reveal.id}`} className="btn-secondary w-fit">
          Open link preview
        </Link>
      </Card>

      <StatusPanel
        title={
          reveal.status === "completed"
            ? "Reveal ready"
            : "Waiting for response"
        }
        description={
          reveal.status === "completed"
            ? "Your partner has completed the quiz."
            : "Share the magic link and wait for their answers."
        }
        tone={reveal.status === "completed" ? "success" : "neutral"}
        action={
          reveal.status === "completed" ? (
            <Link href={`/reveal/${reveal.id}`} className="btn-primary">
              View reveal
            </Link>
          ) : undefined
        }
      />
    </div>
  );
}
