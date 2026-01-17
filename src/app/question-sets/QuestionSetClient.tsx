"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/Card";
import { useRevealStore } from "@/store/revealStore";
import type { QuestionSet } from "@/lib/data/types";

type FetchState = "idle" | "loading" | "error";

type SelectionState = "idle" | "saving" | "error";

export function QuestionSetClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const revealId = searchParams.get("revealId");
  const { questionSetKey, setQuestionSetKey } = useRevealStore();
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [fetchState, setFetchState] = useState<FetchState>("idle");
  const [selectionState, setSelectionState] = useState<SelectionState>("idle");
  const [selectedKey, setSelectedKey] = useState(questionSetKey);

  useEffect(() => {
    const load = async () => {
      setFetchState("loading");
      try {
        const response = await fetch("/api/question-sets");
        const data = await response.json();
        setQuestionSets(data.questionSets ?? []);
        setFetchState("idle");
      } catch (err) {
        setFetchState("error");
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedKey && questionSetKey) {
      setSelectedKey(questionSetKey);
    }
  }, [questionSetKey, selectedKey]);

  const selectedSet = useMemo(
    () => questionSets.find((set) => set.key === selectedKey) ?? null,
    [questionSets, selectedKey]
  );

  const handleContinue = async () => {
    if (!selectedSet) return;
    setSelectionState("saving");
    try {
      if (revealId) {
        const response = await fetch(`/api/reveals/${revealId}/question-set`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionSetKey: selectedSet.key })
        });
        if (!response.ok) {
          setSelectionState("error");
          return;
        }
      }
      setQuestionSetKey(selectedSet.key);
      if (revealId) {
        window.location.assign(`/dashboard/${revealId}`);
        return;
      }
      router.push("/purchase");
    } catch (err) {
      setSelectionState("error");
    }
  };

  return (
    <div className="space-y-8">
      <Card className="space-y-3">
        <p className="kicker">Question sets</p>
        <h1 className="text-3xl font-semibold text-navy">Pick the tone</h1>
        <p className="text-sm text-navy/70">
          Choose the set that matches the conversation you want to have.
        </p>
      </Card>

      {fetchState === "loading" ? (
        <Card>
          <p className="text-sm text-navy/70">Loading question sets...</p>
        </Card>
      ) : null}

      {fetchState === "error" ? (
        <Card>
          <p className="text-sm text-red-700">Unable to load question sets.</p>
        </Card>
      ) : fetchState === "loading" ? null : (
        <div className="grid gap-6 md:grid-cols-3">
          {questionSets.map((set) => (
            <button
              key={set.key}
              type="button"
              className={
                selectedKey === set.key
                  ? "text-left"
                  : "text-left"
              }
              onClick={() => setSelectedKey(set.key)}
            >
              <Card
                className={
                  selectedKey === set.key
                    ? "space-y-3 border-2 border-navy"
                    : "space-y-3"
                }
              >
                <p className="text-xs uppercase tracking-[0.25em] text-mint-600">
                  {set.type === "single" ? "Quick picks" : "Reflective"}
                </p>
                <h2 className="text-xl font-semibold text-navy">{set.title}</h2>
                <p className="text-sm text-navy/70">{set.description}</p>
              </Card>
            </button>
          ))}
        </div>
      )}

      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-navy">
            {selectedSet ? selectedSet.title : "Choose a set to continue"}
          </p>
          <p className="text-xs text-navy/60">
            {selectedSet
              ? "Selection is saved for this reveal."
              : "Selection is required before moving on."}
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={handleContinue}
          disabled={!selectedSet || selectionState === "saving"}
        >
          {selectionState === "saving" ? "Saving" : "Continue"}
        </button>
      </Card>

      {selectionState === "error" ? (
        <p className="text-sm text-red-700">We could not save that selection.</p>
      ) : null}
    </div>
  );
}
