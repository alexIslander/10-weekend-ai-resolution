"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/Card";
import { FeedbackForm } from "@/components/FeedbackForm";
import { ProgressBar } from "@/components/ProgressBar";
import type { Question, Reveal } from "@/lib/data/types";

type QuizClientProps = {
  reveal: Reveal;
  questions: Question[];
};

type LockStatus = "pending" | "ok" | "locked" | "completed" | "not-ready" | "error";

type AnswerState = Record<string, string>;

type OptionState = Record<string, string>;

export function QuizClient({ reveal, questions }: QuizClientProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [respondentName, setRespondentName] = useState("");
  const [responses, setResponses] = useState<AnswerState>({});
  const [selectedOptions, setSelectedOptions] = useState<OptionState>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [showFeedback, setShowFeedback] = useState(true);
  const [lockStatus, setLockStatus] = useState<LockStatus>("pending");
  const [lockId, setLockId] = useState("");
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const textAnswerRef = useRef<HTMLTextAreaElement | null>(null);
  const firstOptionRef = useRef<HTMLInputElement | null>(null);

  const totalSteps = questions.length + 2;
  const totalProgressSteps = questions.length + 1;
  const isWelcomeStep = currentStep === 0;
  const isNameStep = currentStep === 1;
  const questionIndex = Math.max(0, currentStep - 2);
  const question = questions[questionIndex];
  const showProgress = currentStep > 0;
  const progressStep = Math.min(
    totalProgressSteps,
    Math.max(1, currentStep)
  );
  const senderLabel = reveal.purchaserEmail || "someone who cares about you";
  const revealTitle = reveal.name?.trim() || "a reveal";

  const canContinue = useMemo(() => {
    if (isWelcomeStep) return true;
    if (isNameStep) return respondentName.trim().length > 0;
    if (!question) return false;
    if (question.answerType === "single") {
      return Boolean(selectedOptions[question.id]);
    }
    return Boolean(responses[question.id]?.trim());
  }, [isWelcomeStep, isNameStep, question, respondentName, responses, selectedOptions]);

  useEffect(() => {
    const key = `dualreveal_quiz_lock_${reveal.id}`;
    const stored = sessionStorage.getItem(key);
    const nextId = stored ?? crypto.randomUUID();
    if (!stored) {
      sessionStorage.setItem(key, nextId);
    }
    setLockId(nextId);

    const reserve = async () => {
      try {
        const response = await fetch(`/api/reveals/${reveal.id}/quiz/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lockId: nextId })
        });
        const data = await response.json();
        if (response.ok) {
          setLockStatus("ok");
          return;
        }
        if (response.status === 409) {
          const message = (data.error ?? "").toLowerCase();
          if (message.includes("completed")) {
            setLockStatus("completed");
          } else if (message.includes("question set")) {
            setLockStatus("not-ready");
          } else {
            setLockStatus("locked");
          }
          return;
        }
        setLockStatus("error");
      } catch (err) {
        setLockStatus("error");
      }
    };

    reserve();
  }, [reveal.id]);

  useEffect(() => {
    if (lockStatus !== "ok") return;
    if (isNameStep) {
      nameInputRef.current?.focus();
      return;
    }
    if (isWelcomeStep) return;
    if (!question) return;
    if (question.answerType === "single") {
      firstOptionRef.current?.focus();
      return;
    }
    textAnswerRef.current?.focus();
  }, [isNameStep, isWelcomeStep, lockStatus, question, currentStep]);

  useEffect(() => {
    if (!question || question.answerType !== "single") return;
    const existing = selectedOptions[question.id];
    if (existing) return;
    const firstOption = question.options?.[0];
    if (!firstOption) return;
    setSelectedOptions((prev) => ({ ...prev, [question.id]: firstOption.id }));
    setResponses((prev) => ({ ...prev, [question.id]: firstOption.label }));
  }, [question, selectedOptions]);

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
        lockId,
        answers: questions.map((item) => ({
          questionId: item.id,
          response: responses[item.id] ?? "",
          selectedOptionId: selectedOptions[item.id] ?? null
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
    if (isWelcomeStep) return "Welcome";
    if (isNameStep) return "Intro";
    return `Question ${questionIndex + 1}`;
  }, [complete, isNameStep, isWelcomeStep, questionIndex]);

  if (lockStatus === "pending") {
    return (
      <Card className="space-y-3">
        <p className="kicker">DualReveal</p>
        <h1 className="text-2xl font-semibold text-navy">Reserving your quiz</h1>
        <p className="text-sm text-navy/70">
          One moment while we secure your session.
        </p>
      </Card>
    );
  }

  if (lockStatus === "locked") {
    return (
      <Card className="space-y-3">
        <p className="kicker">DualReveal</p>
        <h1 className="text-2xl font-semibold text-navy">Quiz already started</h1>
        <p className="text-sm text-navy/70">
          This quiz is already in progress in another tab or device. Please finish it
          there, or come back later.
        </p>
      </Card>
    );
  }

  if (lockStatus === "completed") {
    return (
      <Card className="space-y-3">
        <p className="kicker">DualReveal</p>
        <h1 className="text-2xl font-semibold text-navy">Already completed</h1>
        <p className="text-sm text-navy/70">
          This reveal has already been submitted. Thank you!
        </p>
      </Card>
    );
  }

  if (lockStatus === "not-ready") {
    return (
      <Card className="space-y-3">
        <p className="kicker">DualReveal</p>
        <h1 className="text-2xl font-semibold text-navy">Quiz not ready</h1>
        <p className="text-sm text-navy/70">
          The question set has not been selected yet. Please come back once the
          quiz is ready.
        </p>
      </Card>
    );
  }

  if (lockStatus === "error") {
    return (
      <Card className="space-y-3">
        <p className="kicker">DualReveal</p>
        <h1 className="text-2xl font-semibold text-navy">Unable to start quiz</h1>
        <p className="text-sm text-navy/70">
          Please refresh the page and try again.
        </p>
      </Card>
    );
  }

  if (complete) {
    const thankYouCard = (
      <Card className="space-y-4">
        <p className="kicker">Thank you</p>
        <h1 className="text-3xl font-semibold text-navy">
          Submission received.
        </h1>
        <p className="text-sm text-navy/70">
          Your answers have been saved. You can close this page now.
        </p>
        <p className="text-sm text-navy/70">
          Your partner will see the reveal as soon as they return to their dashboard.
        </p>
      </Card>
    );

    if (!showFeedback) {
      return <div className="mx-auto max-w-2xl">{thankYouCard}</div>;
    }

    return (
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        {thankYouCard}
        <FeedbackForm
          revealId={reveal.id}
          source="respondent"
          title="How did this feel?"
          description="A quick rating helps us keep the experience kind and clear."
          variant="compact"
          dismissible
          onDismiss={() => setShowFeedback(false)}
        />
      </div>
    );
  }

  if (isWelcomeStep) {
    return (
      <div className="flex min-h-[70vh] items-start justify-center pt-[26vh] md:pt-[30vh]">
        <Card className="w-full max-w-2xl space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-mint-600">
              From {senderLabel}
            </p>
            <h1 className="text-3xl font-semibold text-navy">
              You're invited to {revealTitle}
            </h1>
            <p className="text-sm text-navy/70">
              This is a quick check-in to help your partner show up for you in
              the ways that matter most. Your answers stay private and are
              shared once.
            </p>
            <p className="text-sm text-navy/70">
              Take a few minutes, be honest, and let them know what feels good
              right now. It only takes a short moment, but it can change how
              they care for you.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-mint-200 bg-mint-50/60 px-4 py-3 text-sm text-navy/70">
            <span className="font-semibold text-navy">
              {questions.length} questions
            </span>
            <span>Private answers</span>
            <span>Submit once</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/" className="btn-secondary">
              Not now
            </Link>
            <button
              type="button"
              className="btn-primary"
              onClick={handleNext}
              disabled={!canContinue}
            >
              Begin
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {showProgress ? (
        <Card className="space-y-4">
          <div className="space-y-2">
            <p className="kicker">DualReveal</p>
            <h1 className="text-2xl font-semibold text-navy">{progressLabel}</h1>
          </div>
          <ProgressBar current={progressStep} total={totalProgressSteps} />
        </Card>
      ) : null}

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
              ref={nameInputRef}
            />
          </div>
        ) : null}

        {!isWelcomeStep && !isNameStep ? (
          <div className="space-y-3">
            <p className="text-lg font-semibold text-navy">{question?.prompt}</p>
            {question?.answerType === "single" ? (
              <div className="space-y-2">
                {(question.options ?? []).map((option, index) => (
                  <label
                    key={option.id}
                    className="flex items-center gap-3 rounded-2xl border border-mint-200 bg-mint-50/60 px-4 py-3 text-sm text-navy"
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option.id}
                      checked={selectedOptions[question.id] === option.id}
                      onChange={() => {
                        setSelectedOptions((prev) => ({
                          ...prev,
                          [question.id]: option.id
                        }));
                        setResponses((prev) => ({
                          ...prev,
                          [question.id]: option.label
                        }));
                      }}
                      ref={index === 0 ? firstOptionRef : undefined}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                id={`question-${question?.id ?? ""}`}
                className="input min-h-[140px]"
                value={responses[question?.id ?? ""] ?? ""}
                onChange={(event) =>
                  setResponses((prev) => ({
                    ...prev,
                    [question?.id ?? ""]: event.target.value
                  }))
                }
                placeholder="Write your response"
                ref={textAnswerRef}
              />
            )}
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
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
          <button
            type="button"
            className="btn-secondary order-first"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            Back
          </button>
        </div>
      </Card>
    </div>
  );
}
