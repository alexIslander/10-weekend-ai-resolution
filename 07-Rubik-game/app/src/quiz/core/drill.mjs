/**
 * The question a drill asks, and the verdict on the answer.
 *
 * Plain ESM: no DOM, no store, no imports outside this directory. The random
 * source is injected so a run can be replayed in tests (see ADR-0001: the four
 * triggers are always the four options, shuffled).
 */
import { shuffle } from "./random.mjs";

/**
 * A question as a run holds it: the trigger drill asks for one step, Route asks
 * for all of them.
 * @typedef {{kind: "trigger", oll: number, expected: string, options: string[]}
 *   | {kind: "route", oll: number, expected: string[]}} Question
 */

/** The four triggers, as the booklet names them. */
export const TRIGGERS = ["S", "AS", "ET", "WT"];

/**
 * Builds the question for one position in the trigger drill: which trigger
 * solves it from its diagram, and the four triggers in an order the player has
 * not seen yet.
 * @param {{oll: number, route: {auf: string, trigger: string}[]}} position
 * @param {() => number} random
 * @returns {Question}
 */
export const askPosition = (position, random) => ({
  kind: "trigger",
  oll: position.oll,
  expected: position.route[0].trigger,
  options: shuffle(TRIGGERS, random),
});

/**
 * Builds the question for one position in Route mode: every step of the route,
 * in order. The answer is built from the same four triggers, so there are no
 * options to shuffle — only a sequence to name.
 * @param {{oll: number, route: {auf: string, trigger: string}[]}} position
 * @returns {Question}
 */
export const askRoute = (position) => ({
  kind: "route",
  oll: position.oll,
  expected: position.route.map(step => step.trigger),
});

/** One answer step as a sequence, so a trigger and a route are judged alike. */
const sequenceOf = value => (Array.isArray(value) ? value : [value]);

/**
 * Judges an answer. Only the first step's trigger counts in the trigger drill
 * (ADR-0001); a route answer must match every step, in order, all or nothing.
 * @param {{expected: string|string[]}} question
 * @param {string|string[]} given the trigger tapped, or the route built
 * @returns {{correct: boolean, expected: string|string[]}}
 */
export const evaluateAnswer = (question, given) => {
  const expected = sequenceOf(question.expected);
  const answered = sequenceOf(given);
  return {
    correct: answered.length === expected.length && answered.every((step, index) => step === expected[index]),
    expected: question.expected,
  };
};
