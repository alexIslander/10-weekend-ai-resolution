import { createReducer } from "@reduxjs/toolkit";
import { playerDeletedAction } from "../control/PlayersControl.js";
import { answerGivenAction, chipAppendedAction, groupChosenAction, hintLevelChosenAction, modeChosenAction, nameTypedAction, nextQuestionAction, runResetAction, runStartedAction } from "../control/RunControl.js";
import { defaultHintLevel, nextRun } from "../core/run.mjs";

/**
 * The run's state: the name it is recorded under, the questions it will ask,
 * where it is, and what it is worth so far. The questions come from the core,
 * so nothing here decides an order or a score.
 */
export const idleState = () => ({
    phase: "idle",
    mode: "random",
    hintLevel: "test",
    group: null,
    name: "",
    questions: [],
    index: 0,
    // a route answer is built up in `chips` and only judged on submit
    chips: [],
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
    }).addCase(modeChosenAction, (state, { payload: mode }) => {
        state.mode = mode;
        state.hintLevel = defaultHintLevel(mode);
    }).addCase(hintLevelChosenAction, (state, { payload: hintLevel }) => {
        state.hintLevel = hintLevel;
    }).addCase(groupChosenAction, (state, { payload: group }) => {
        state.group = group;
    }).addCase(runStartedAction, (state, { payload }) => {
        Object.assign(state, idleState(), payload);
        state.phase = "running";
    }).addCase(chipAppendedAction, (state, { payload: trigger }) => {
        // `?? []` reads a run persisted before this mode existed
        if (state.given === null) state.chips = [...(state.chips ?? []), trigger];
    }).addCase(answerGivenAction, (state, { payload: { given, outcome } }) => {
        state.given = given;
        state.score = outcome.score;
        state.streak = outcome.streak;
        state.correct = outcome.correctCount;
        state.complete = outcome.complete;
    }).addCase(nextQuestionAction, (state, { payload: at }) => {
        state.index += 1;
        state.chips = [];
        state.given = null;
        if (state.complete) {
            state.phase = "finished";
            state.finishedAt = at;
        }
    }).addCase(playerDeletedAction, (state, { payload: name }) => {
        // the name was only ever a player's: once that player is gone, so is it
        if (state.name === name) state.name = "";
    }).addCase(runResetAction, (state) => {
        // the next run starts the way this one did, under the same name — a
        // drill hands the screen back to the picker's default
        const name = state.name;
        Object.assign(state, idleState(), nextRun(state), { name });
    });
});
