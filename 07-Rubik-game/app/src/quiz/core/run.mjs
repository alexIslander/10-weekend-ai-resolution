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
export const MODES = ["random", "grouped", "progressive"];

/** The two hint levels every mode runs at (ADR-0002). */
export const HINT_LEVELS = ["training", "test"];

/** The hint level a mode starts at: Progressive warms up, the rest test. */
export const defaultHintLevel = mode => (mode === "progressive" ? "training" : "test");

/** What a correct answer at this streak is multiplied by. */
export const multiplierFor = streak => Math.min(streak, STREAK_CAP);

/** The 14 groups, in the booklet's order: the first position to carry each name fixes it. */
export const groupsOf = positions => [...new Set(positions.map(({ group }) => group))];

/**
 * The positions a mode draws from — all of them, or one group's; a grouped run
 * without a group is refused rather than silently asking everything.
 * @param {{oll: number, group: string, steps: number, route: {auf: string, trigger: string}[]}[]} positions
 * @param {{mode: string, group?: string}} options
 */
export const poolOf = (positions, { mode, group }) => {
  if (!MODES.includes(mode)) throw new Error(`unsupported mode "${mode}"`);
  if (mode !== "grouped") return [...positions];
  const pool = positions.filter(position => position.group === group);
  if (pool.length === 0) throw new Error(`unsupported group "${group}"`);
  return pool;
};

/**
 * Builds a run: every position of the mode's pool exactly once, in an order the
 * random source decides, each with its four options shuffled. Progressive walks
 * one-step, then two-step, then three-step, shuffled within each block.
 * @param {{oll: number, group: string, steps: number, route: {auf: string, trigger: string}[]}[]} positions
 * @param {{mode: string, group?: string, random: () => number}} options
 * @returns {{oll: number, expected: string, options: string[]}[]} the questions
 */
export const buildRun = (positions, { mode, group, random }) => {
  const pool = poolOf(positions, { mode, group });
  if (mode !== "progressive") return shuffle(pool, random).map(position => askPosition(position, random));
  const blocks = new Map();
  for (const position of pool) blocks.set(position.steps, [...(blocks.get(position.steps) ?? []), position]);
  return [...blocks.keys()].sort((a, b) => a - b)
    .flatMap(steps => shuffle(blocks.get(steps), random))
    .map(position => askPosition(position, random));
};

/** How long a finished run took: the board's tie-break, never a countdown. */
export const elapsedOf = run => Math.max(0, run.finishedAt - run.startedAt);

/** Correct answers as a whole percentage, for a result screen or a stats row. */
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
