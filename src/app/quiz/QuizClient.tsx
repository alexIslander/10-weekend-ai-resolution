"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { ProgressBar } from "@/components/ProgressBar";
import type { Question, Reveal } from "@/lib/data/types";

type QuizClientProps = {
  reveal: Reveal;
  questions: Question[];
};

export function QuizClient({ reveal, questions }: QuizClientProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [respondentName, setRespondentName] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  const totalSteps = questions.length + 1;
  const isNameStep = currentStep === 0;
  const questionIndex = Math.max(0, currentStep - 1);
  const question = questions[questionIndex];

  const canContinue = isNameStep
    ? respondentName.trim().length > 0
    : Boolean(answers[question?.id ?? ""]?.trim());

  const handleNext = () => {
    if (!canContinue) return;
    setCurrentStep((step) => Math.min(totalSteps - 1, step + 1));
  };

  const handleBack = () => {
    setCurrentStep((step) => Math.max(0, step - 1));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        respondentName: respondentName.trim(),
        answers: questions.map((item) => ({
          questionId: item.id,
          response: answers[item.id] ?? ""
        }))
      };
      const response = await fetch(`/api/reveals/${reveal.id}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Something went wrong.");
        setSubmitting(false);
        return;
      }
      setComplete(true);
    } catch (err) {
      setError("We could not submit your answers.");
    } finally {
      setSubmitting(false);
    }
  };

  const progressLabel = useMemo(() => {
    if (complete) return "All done";
    return isNameStep ? "Intro" : `Question ${questionIndex + 1}`;
  }, [complete, isNameStep, questionIndex]);

  if (complete) {
    return (
      <Card className="space-y-4">
        <p className="kicker">Thank you</p>
        <h1 className="text-2xl font-semibold text-navy">Quiz complete.</h1>
        <p className="text-sm text-navy/70">
          Your answers have been saved. You can close this page now.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="space-y-4">
        <div className="space-y-2">
          <p className="kicker">DualReveal</p>
          <h1 className="text-2xl font-semibold text-navy">{progressLabel}</h1>
        </div>
        <ProgressBar current={currentStep + 1} total={totalSteps} />
      </Card>

      <Card className="space-y-4">
        {isNameStep ? (
          <div className="space-y-3">
            <label
              htmlFor="respondent-name"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-mint-600"
            >
              Your name
            </label>
            <input
              id="respondent-name"
              className="input"
              value={respondentName}
              onChange={(event) => setRespondentName(event.target.value)}
              placeholder="Enter your first name"
            />
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-lg font-semibold text-navy">{question?.prompt}</p>
            <textarea
              id={`question-${question?.id ?? ""}`}
              className="input min-h-[140px]"
              value={answers[question?.id ?? ""] ?? ""}
              onChange={(event) =>
                setAnswers((prev) => ({
                  ...prev,
                  [question?.id ?? ""]: event.target.value
                }))
              }
              placeholder="Write your response"
            />
          </div>
        )}

        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            Back
          </button>
          {currentStep < totalSteps - 1 ? (
            <button
              type="button"
              className="btn-primary"
              onClick={handleNext}
              disabled={!canContinue}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={handleSubmit}
              disabled={submitting || !canContinue}
            >
              {submitting ? "Submitting" : "Submit answers"}
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}
