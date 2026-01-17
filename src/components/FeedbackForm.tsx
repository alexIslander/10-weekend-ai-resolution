"use client";

import { useState } from "react";
import { Card } from "@/components/Card";
import type { FeedbackSource } from "@/lib/data/types";

type FeedbackFormProps = {
  revealId: string;
  source: FeedbackSource;
  title: string;
  description: string;
  variant?: "default" | "compact";
  dismissible?: boolean;
  onDismiss?: () => void;
};

type SubmitState = "idle" | "saving" | "saved" | "error";

export function FeedbackForm({
  revealId,
  source,
  title,
  description,
  variant = "default",
  dismissible = false,
  onDismiss
}: FeedbackFormProps) {
  const [rating, setRating] = useState<boolean | null>(null);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<SubmitState>("idle");
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = () => {
    if (!dismissible) return;
    if (onDismiss) {
      onDismiss();
      return;
    }
    setDismissed(true);
  };

  const handleSubmit = async () => {
    if (rating === null) return;
    setStatus("saving");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          revealId,
          source,
          rating,
          note: note.trim() ? note.trim() : null
        })
      });
      if (!response.ok) {
        setStatus("error");
        return;
      }
      setStatus("saved");
      if (dismissible) {
        handleDismiss();
      }
    } catch (err) {
      setStatus("error");
    }
  };

  if (dismissed) return null;

  const isCompact = variant === "compact";
  const titleClass = isCompact
    ? "text-base font-semibold text-navy"
    : "text-lg font-semibold text-navy";
  const descriptionClass = isCompact ? "text-xs text-navy/60" : "text-sm text-navy/70";

  return (
    <Card
      className={
        isCompact
          ? "space-y-3 border-mint-100 bg-white/70 p-5 shadow-none"
          : "space-y-3"
      }
    >
      <p className={isCompact ? "kicker text-xs" : "kicker"}>Feedback</p>
      <h3 className={titleClass}>{title}</h3>
      <p className={descriptionClass}>{description}</p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={rating === true ? "btn-primary" : "btn-secondary"}
          onClick={() => setRating(true)}
        >
          Thumbs up
        </button>
        <button
          type="button"
          className={rating === false ? "btn-primary" : "btn-secondary"}
          onClick={() => setRating(false)}
        >
          Thumbs down
        </button>
      </div>
      <div className="space-y-2">
        <label
          htmlFor={`feedback-note-${source}`}
          className="text-xs font-semibold uppercase tracking-[0.2em] text-mint-600"
        >
          Optional note
        </label>
        <textarea
          id={`feedback-note-${source}`}
          className={isCompact ? "input min-h-[90px]" : "input min-h-[120px]"}
          maxLength={280}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Share anything that would make this better"
        />
        <p className="text-xs text-navy/60">{note.length}/280</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn-secondary"
          onClick={handleSubmit}
          disabled={rating === null || status === "saving" || status === "saved"}
        >
          {status === "saving" ? "Saving" : status === "saved" ? "Thanks" : "Submit"}
        </button>
        {dismissible ? (
          <button
            type="button"
            className="btn-secondary"
            onClick={handleDismiss}
          >
            Not now
          </button>
        ) : null}
      </div>
      {status === "error" ? (
        <p className="text-xs text-red-700">We could not save that feedback.</p>
      ) : null}
    </Card>
  );
}
