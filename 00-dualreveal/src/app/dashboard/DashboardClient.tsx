"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";
import { CopyButton } from "@/components/CopyButton";
import { StatusPanel } from "@/components/StatusPanel";
import { getBaseUrl } from "@/lib/base-url";
import type { QuestionSet, Reveal } from "@/lib/data/types";

type DashboardClientProps = {
  reveal: Reveal;
  questionSet: QuestionSet | null;
  emailSendEnabled: boolean;
};

export function DashboardClient({
  reveal,
  questionSet,
  emailSendEnabled
}: DashboardClientProps) {
  const [revealState, setRevealState] = useState(reveal);
  const [name, setName] = useState(reveal.name ?? "");
  const [saving, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const magicLink = `${getBaseUrl()}/quiz/${revealState.id}`;
  const isCompleted = revealState.status === "completed";
  const canShare = Boolean(revealState.questionSetId) && !isCompleted;

  const shareSupported = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return Boolean(navigator.share);
  }, []);

  const handleShare = async () => {
    setShareMessage(null);
    if (shareSupported) {
      try {
        await navigator.share({
          title: "DualReveal quiz",
          text: "A private quiz just for you.",
          url: magicLink
        });
        return;
      } catch (err) {
        setShareMessage("Share canceled.");
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(magicLink);
      setShareMessage("Link copied.");
    } catch (err) {
      setShareMessage("Unable to share right now.");
    }
  };

  const handleEmailSend = () => {
    setEmailMessage("Email sending is not configured yet.");
  };

  const handleSave = () => {
    startTransition(async () => {
      setMessage(null);
      const response = await fetch(`/api/reveals/${revealState.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error ?? "Could not update the reveal name.");
        return;
      }
      if (data.reveal) {
        setRevealState(data.reveal);
      }
      setMessage("Saved.");
    });
  };

  useEffect(() => {
    if (isCompleted) return;
    let active = true;
    const refreshStatus = async () => {
      try {
        const response = await fetch(`/api/reveals/${revealState.id}`);
        if (!response.ok) return;
        const data = await response.json();
        if (!active || !data?.reveal) return;
        setRevealState((prev) => {
          if (
            prev.status === data.reveal.status &&
            prev.questionSetId === data.reveal.questionSetId &&
            prev.name === data.reveal.name
          ) {
            return prev;
          }
          return data.reveal;
        });
      } catch (err) {
        // Ignore transient polling errors.
      }
    };

    const interval = setInterval(refreshStatus, 8000);
    refreshStatus();
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isCompleted, revealState.id]);

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
          {canShare ? (
            <div className="flex items-center gap-2">
              <CopyButton text={magicLink} />
              <button
                type="button"
                className="btn-secondary"
                onClick={handleShare}
              >
                Share
              </button>
            </div>
          ) : null}
        </div>
        {isCompleted ? (
          <div className="space-y-3">
            <p className="text-sm text-navy/70">
              This reveal is complete. The quiz link is now closed.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href={`/reveal/${revealState.id}`} className="btn-secondary">
                View reveal
              </Link>
              <Link href="/purchase" className="btn-primary">
                Start a new reveal
              </Link>
            </div>
          </div>
        ) : canShare ? (
          <>
            <p className="text-sm text-navy/70 break-all" data-testid="magic-link">
              {magicLink}
            </p>
            <Link href={`/quiz/${revealState.id}`} className="btn-secondary w-fit">
              Open link preview
            </Link>
          </>
        ) : (
          <p className="text-sm text-navy/70">
            Select a question set to generate the magic link.
          </p>
        )}
        {shareMessage ? (
          <p className="text-xs text-mint-700">{shareMessage}</p>
        ) : null}
      </Card>

      <Card className="space-y-3">
        <p className="kicker">Question set</p>
        <p className="text-lg font-semibold text-navy">
          {questionSet?.title ?? "No selection yet"}
        </p>
        <p className="text-sm text-navy/70">
          {questionSet?.description ??
            "Pick a question set to unlock the quiz link."}
        </p>
        {!revealState.questionSetId ? (
          <Link
            href={`/question-sets?revealId=${revealState.id}`}
            className="btn-primary w-fit"
          >
            Select question set
          </Link>
        ) : null}
      </Card>

      {emailSendEnabled ? (
        <Card className="space-y-3">
          <p className="kicker">Email the link</p>
          <p className="text-sm text-navy/70">
            Send the magic link directly from the dashboard.
          </p>
          <div className="space-y-2">
            <label
              htmlFor="email-recipient"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-mint-600"
            >
              Recipient email
            </label>
            <input
              id="email-recipient"
              type="email"
              className="input"
              value={emailRecipient}
              onChange={(event) => setEmailRecipient(event.target.value)}
              placeholder="partner@example.com"
            />
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleEmailSend}
            disabled={!emailRecipient || !canShare}
          >
            Send link
          </button>
          {emailMessage ? (
            <p className="text-xs text-mint-700">{emailMessage}</p>
          ) : null}
        </Card>
      ) : null}

      <StatusPanel
        title={
          revealState.status === "completed"
            ? "Reveal ready"
            : "Waiting for response"
        }
        description={
          revealState.status === "completed"
            ? "Your partner has completed the quiz. This link is now closed."
            : "Share the magic link and wait for their answers."
        }
        tone={revealState.status === "completed" ? "success" : "neutral"}
        action={
          revealState.status === "completed" ? (
            <Link href={`/reveal/${revealState.id}`} className="btn-primary">
              View reveal
            </Link>
          ) : undefined
        }
      />
    </div>
  );
}
