/**
 * A scored run: which positions are asked, in which order, and what an answer
 * is worth. Plain ESM — no DOM, no store, no imports outside this directory —
 * and the random source is injected, so a run replays exactly in a test.
 */
import { askPosition, evaluateAnswer } from "./drill.mjs";
import { shuffle } from "./random.mjs";

/** Points for a correct answer, before the streak multiplier. */
export const POINTS_PER_CORRECT = 10;

/** The multiplier climbs 1 → 5 and stops there (ADR-0004). */
export const STREAK_CAP = 5;

/** The modes the game knows today; later tickets add the rest (ADR-0002). */
export const MODES = ["random"];

/** The two hint levels every mode runs at (ADR-0002). */
export const HINT_LEVELS = ["training", "test"];

/** What a correct answer at this streak is multiplied by. */
export const multiplierFor = streak => Math.min(streak, STREAK_CAP);

/**
 * Builds a run: every position exactly once, in an order the random source
 * decides, each with its four options shuffled.
 * @param {{oll: number, route: {auf: string, trigger: string}[]}[]} positions
 * @param {{mode?: string, random: () => number}} options
 * @returns {{oll: number, expected: string, options: string[]}[]} the questions
 */
export const buildRun = (positions, { mode = "random", random }) => {
  if (!MODES.includes(mode)) throw new Error(`unsupported mode "${mode}"`);
  return shuffle(positions, random).map(position => askPosition(position, random));
};

/** Correct answers as a whole percentage, for a result screen or a stats row. */
/** How long a finished run took: the board's tie-break, never a countdown. */
export const elapsedOf = run => Math.max(0, run.finishedAt - run.startedAt);

export const accuracy = (correct, total) => (total === 0 ? 0 : Math.round((correct / total) * 100));

/**
 * Judges an answer inside a run and says what it was worth.
 * @param {{expected: string}} question
 * @param {string} given the trigger the player tapped
 * @param {{index: number, total: number, score: number, streak: number, correct: number}} progress
 * @returns {{correct: boolean, expected: string, points: number, streak: number, score: number, correctCount: number, complete: boolean}}
 */
export const answer = (question, given, progress) => {
  const { correct, expected } = evaluateAnswer(question, given);
  const streak = correct ? progress.streak + 1 : 0;
  const points = correct ? POINTS_PER_CORRECT * multiplierFor(streak) : 0;
  return {
    correct,
    expected,
    points,
    streak,
    score: progress.score + points,
    correctCount: progress.correct + (correct ? 1 : 0),
    complete: progress.index + 1 >= progress.total,
  };
};
