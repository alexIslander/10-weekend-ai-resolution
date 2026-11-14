/**
 * The question a drill screen asks, and the verdict on the answer.
 *
 * Plain ESM: no DOM, no store, no imports outside this directory. The random
 * source is injected so a run can be replayed in tests (see ADR-0001: the four
 * triggers are always the four options, shuffled).
 */

/** The four triggers, as the booklet names them. */
export const TRIGGERS = ["S", "AS", "ET", "WT"];

/**
 * Fisher-Yates over a copy, driven by the injected random source.
 * @param {string[]} items
 * @param {() => number} random returns a number in [0, 1)
 * @returns {string[]} a new, shuffled array
 */
const shuffle = (items, random) => {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const pick = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[pick]] = [shuffled[pick], shuffled[index]];
  }
  return shuffled;
};

/**
 * Draws the position a drill asks about from the injected random source, so a
 * drill is replayable in a test and the screen never picks data itself.
 * @template {{oll: number}} Position
 * @param {Position[]} positions
 * @param {() => number} random
 * @returns {Position}
 */
export const pickPosition = (positions, random) => positions[Math.floor(random() * positions.length)];

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
