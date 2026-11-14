import { createAction } from "@reduxjs/toolkit";
import store from "../../store.js";
import { answer, buildRun, groupFor, HINT_LEVELS, MODES, DRILL } from "../core/run.mjs";
import { askPosition, TRIGGERS } from "../core/drill.mjs";
import { groups, positionOf, positions } from "../entity/Positions.js";

export const nameTypedAction = createAction("nameTypedAction");
export const modeChosenAction = createAction("modeChosenAction");
export const hintLevelChosenAction = createAction("hintLevelChosenAction");
export const groupChosenAction = createAction("groupChosenAction");
export const runStartedAction = createAction("runStartedAction");
export const chipAppendedAction = createAction("chipAppendedAction");
export const answerGivenAction = createAction("answerGivenAction");
export const nextQuestionAction = createAction("nextQuestionAction");
export const runFinishedAction = createAction("runFinishedAction");
export const runResetAction = createAction("runResetAction");

/**
 * Keeps the typed name in the store, so the screen can refuse an empty one
 * before anything starts.
 * @param {string} name what is in the field right now
 */
export const nameTyped = (name) => {
    store.dispatch(nameTypedAction(name));
}

/** Chooses the mode for the next run; the hint level follows the mode's default. */
export const modeChosen = (mode) => {
    if (!MODES.includes(mode)) return;
    store.dispatch(modeChosenAction(mode));
}

/** Chooses the hint level for the next run. */
export const hintLevelChosen = (hintLevel) => {
    if (!HINT_LEVELS.includes(hintLevel)) return;
    store.dispatch(hintLevelChosenAction(hintLevel));
}

/** Chooses the group a Grouped run drills. */
export const groupChosen = (group) => {
    if (!groups.includes(group)) return;
    store.dispatch(groupChosenAction(group));
}

/**
 * Starts a scored run under the given name, in the mode and at the hint level
 * chosen on the play screen. An empty name starts nothing: the score has to
 * belong to a player.
 * @param {string} name
 * @param {{random?: () => number, now?: () => number}} [sources] injected for tests
 * @returns {boolean} whether a run was started
 */
export const startRun = (name, { random = Math.random, now = Date.now } = {}) => {
    const player = name.trim();
    if (!player) return false;
    const { run } = store.getState();
    const group = groupFor(groups, run);
    store.dispatch(runStartedAction({
        name: player,
        mode: run.mode,
        hintLevel: run.hintLevel,
        group,
        questions: buildRun(positions, { mode: run.mode, group, random }),
        startedAt: now()
    }));
    return true;
}

/**
 * Starts a drill: one question on one position, under the name the play screen
 * last used. A drill is not a board mode — its finished run is practice, not a
 * score — and it always asks at Test, since the point is to recall the trigger.
 * No name records nothing, so no name starts no drill.
 * @param {number} oll the position to ask
 * @param {{random?: () => number, now?: () => number}} [sources] injected for tests
 * @returns {boolean} whether a drill was started
 */
export const startDrill = (oll, { random = Math.random, now = Date.now } = {}) => {
    const { run } = store.getState();
    const name = (run.name ?? "").trim();
    const position = positionOf(oll);
    if (!name || !position) return false;
    store.dispatch(runStartedAction({
        name,
        mode: DRILL,
        hintLevel: "test",
        group: null,
        questions: [askPosition(position, random)],
        startedAt: now()
    }));
    return true;
}

/**
 * Records the answer to the current question, with what it was worth and what it
 * changes about the player's record of that position. One answer per question:
 * a second one is ignored.
 * @param {string|string[]} given the trigger tapped, or the route submitted
 * @param {{now?: () => number}} [sources]
 * @returns {boolean} whether the answer was recorded
 */
const answerCurrent = (given, { now = Date.now } = {}) => {
    const { run } = store.getState();
    if (run.phase !== "running" || run.given !== null) return false;
    const question = run.questions[run.index];
    const outcome = answer(question, given, {
        index: run.index,
        total: run.questions.length,
        score: run.score,
        streak: run.streak,
        correct: run.correct
    });
    store.dispatch(answerGivenAction({ given, question, outcome, name: run.name, at: now() }));
    return true;
}

/**
 * Answers the current question with the trigger the player tapped.
 * @param {string} trigger one of S, AS, ET, WT
 * @param {{now?: () => number}} [sources]
 */
export const answerWith = (trigger, sources) => answerCurrent(trigger, sources);

/**
 * Appends a trigger to the route being built. Nothing is checked here: the
 * sequence is judged when the player submits it.
 * @param {string} trigger one of S, AS, ET, WT
 */
export const chipTapped = (trigger) => {
    const { run } = store.getState();
    if (run.phase !== "running" || run.given !== null) return;
    if (!TRIGGERS.includes(trigger)) return;
    store.dispatch(chipAppendedAction(trigger));
}

/**
 * Submits the route built so far — the one moment a Route answer is judged, and
 * judged whole: no step is worth anything on its own.
 * @param {{now?: () => number}} [sources]
 * @returns {boolean} whether an answer was recorded
 */
export const submitRoute = (sources) => {
    const { run } = store.getState();
    if (run.chips.length === 0) return false;
    return answerCurrent([...run.chips], sources);
}

/**
 * Moves to the next question, or to the finish screen after the last one, where
 * the finished run is added to the player's history (one entry, once).
 * @param {{now?: () => number}} [sources]
 */
export const nextQuestion = ({ now = Date.now } = {}) => {
    const { run } = store.getState();
    if (run.phase !== "running" || run.given === null) return;
    store.dispatch(nextQuestionAction(now()));
    const finished = store.getState().run;
    if (finished.phase !== "finished") return;
    store.dispatch(runFinishedAction({
        name: finished.name,
        mode: finished.mode,
        hintLevel: finished.hintLevel,
        score: finished.score,
        correct: finished.correct,
        total: finished.questions.length,
        startedAt: finished.startedAt,
        finishedAt: finished.finishedAt
    }));
}

/** Leaves the finish screen, keeping the name for the next run. */
export const resetRun = () => {
    store.dispatch(runResetAction());
}
