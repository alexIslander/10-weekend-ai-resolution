/**
 * A scored run: which positions are asked, in which order, and what an answer
 * is worth. Plain ESM — no DOM, no store, no imports outside this directory —
 * and the random source is injected, so a run replays exactly in a test.
 */
import { askPosition, evaluateAnswer } from "./drill.mjs";
import { shuffle } from "./random.mjs";

/**
 * One finished run, as a player's history keeps it: what a board ranks and the
 * stats add up.
 * @typedef {{mode: string, hintLevel: string, score: number, correct: number, total: number, startedAt: number, finishedAt: number}} FinishedRun
 */

/** Points for a correct answer, before the streak multiplier. */
export const POINTS_PER_CORRECT = 10;

/** The multiplier climbs 1 → 5 and stops there (ADR-0004). */
export const STREAK_CAP = 5;

/** The modes the game knows today; later tickets add the rest (ADR-0002). */
export const MODES = ["random", "grouped", "progressive"];

/**
 * A drill asks one position and nothing else. It is a mode in the sense that a
 * run carries one, but the picker never offers it and no board takes its score:
 * it is practice on a position the player got wrong, launched from the stats.
 */
export const DRILL = "drill";

/** Whether a finished run of this mode lands on a board. */
export const isBoardMode = mode => MODES.includes(mode);

/** The two hint levels every mode runs at (ADR-0002). */
export const HINT_LEVELS = ["training", "test"];

/** The hint level a mode starts at: Progressive warms up, the rest test. */
export const defaultHintLevel = mode => (mode === "progressive" ? "training" : "test");

/** What a correct answer at this streak is multiplied by. */
export const multiplierFor = streak => Math.min(streak, STREAK_CAP);

/**
 * The group a run uses: the chosen one for Grouped, nothing for a mode that
 * asks everything. A group the data no longer carries falls back to the first,
 * so a stale persisted choice cannot break the screen.
 * @param {string[]} groups the 14 group names, in booklet order
 * @param {{mode?: string, group?: string|null}} choices
 * @returns {string|undefined}
 */
export const groupFor = (groups, { mode, group }) =>
  mode === "grouped" ? (groups.includes(group) ? group : groups[0]) : undefined;

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

/**
 * The choices the play screen reopens with after a run: the run's own, unless
 * it was a drill — a mode the picker does not offer, so the screen falls back to
 * the default rather than showing a mode with no button pressed.
 * @param {{mode: string, hintLevel: string, group?: string|null}} run
 * @returns {{mode: string, hintLevel: string, group: string|null}}
 */
export const nextRun = ({ mode, hintLevel, group }) =>
  isBoardMode(mode)
    ? { mode, hintLevel, group: group ?? null }
    : { mode: MODES[0], hintLevel: defaultHintLevel(MODES[0]), group: null };

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
