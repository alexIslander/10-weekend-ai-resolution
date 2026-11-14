/**
 * The question a drill asks, and the verdict on the answer.
 *
 * Plain ESM: no DOM, no store, no imports outside this directory. The random
 * source is injected so a run can be replayed in tests (see ADR-0001: the four
 * triggers are always the four options, shuffled).
 */
import { shuffle } from "./random.mjs";

/** The four triggers, as the booklet names them. */
export const TRIGGERS = ["S", "AS", "ET", "WT"];

/**
 * Builds the question for one position: which trigger solves it from its
 * diagram, and the four triggers in an order the player has not seen yet.
 * @param {{oll: number, route: {auf: string, trigger: string}[]}} position
 * @param {() => number} random
 */
export const askPosition = (position, random) => ({
  oll: position.oll,
  expected: position.route[0].trigger,
  options: shuffle(TRIGGERS, random),
});

/**
 * Judges an answer. Only the first step's trigger counts: AUF turns belong to
 * the route, not to the question (ADR-0001).
 * @param {{expected: string}} question
 * @param {string} given the trigger the player tapped
 * @returns {{correct: boolean, expected: string}}
 */
export const evaluateAnswer = (question, given) => ({
  correct: given === question.expected,
  expected: question.expected,
});
