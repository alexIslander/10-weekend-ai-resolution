import { createReducer } from "@reduxjs/toolkit";
import { answerGivenAction, nameTypedAction, nextQuestionAction, runResetAction, runStartedAction } from "../control/RunControl.js";

/**
 * The run's state: the name it is recorded under, the questions it will ask,
 * where it is, and what it is worth so far. The questions come from the core,
 * so nothing here decides an order or a score.
 */
const idle = {
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
    startedAt: null,
    finishedAt: null
};

export const run = createReducer(idle, (builder) => {
    builder.addCase(nameTypedAction, (state, { payload }) => {
        state.name = payload;
    }).addCase(runStartedAction, (state, { payload }) => {
        Object.assign(state, idle, payload);
        state.phase = "running";
    }).addCase(answerGivenAction, (state, { payload: { given, outcome } }) => {
        state.given = given;
        state.score = outcome.score;
        state.streak = outcome.streak;
        state.correct += outcome.correct ? 1 : 0;
    }).addCase(nextQuestionAction, (state, { payload: at }) => {
        state.index += 1;
        state.given = null;
        if (state.index >= state.questions.length) {
            state.phase = "finished";
            state.finishedAt = at;
        }
    }).addCase(runResetAction, (state) => {
        Object.assign(state, idle, { name: state.name });
    });
});
