import { createReducer } from "@reduxjs/toolkit";
import { answerGivenAction, nameTypedAction, nextQuestionAction, runResetAction, runStartedAction } from "../control/RunControl.js";

/**
 * The run's state: the name it is recorded under, the questions it will ask,
 * where it is, and what it is worth so far. The questions come from the core,
 * so nothing here decides an order or a score.
 */
const idleState = () => ({
    phase: "idle",
    mode: "random",
    hintLevel: "test",
    name: "",
    questions: [],
    index: 0,
    given: null,
    score: 0,
    streak: 0,
    correct: 0,
    complete: false,
    startedAt: null,
    finishedAt: null
});

export const run = createReducer(idleState(), (builder) => {
    builder.addCase(nameTypedAction, (state, { payload }) => {
        state.name = payload;
    }).addCase(runStartedAction, (state, { payload }) => {
        Object.assign(state, idleState(), payload);
        state.phase = "running";
    }).addCase(answerGivenAction, (state, { payload: { given, outcome } }) => {
        state.given = given;
        state.score = outcome.score;
        state.streak = outcome.streak;
        state.correct = outcome.correctCount;
        state.complete = outcome.complete;
    }).addCase(nextQuestionAction, (state, { payload: at }) => {
        state.index += 1;
        state.given = null;
        if (state.complete) {
            state.phase = "finished";
            state.finishedAt = at;
        }
    }).addCase(runResetAction, (state) => {
        Object.assign(state, idleState(), { name: state.name });
    });
});
