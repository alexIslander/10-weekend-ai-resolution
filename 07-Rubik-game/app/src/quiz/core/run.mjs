/**
 * A scored run: which positions are asked, in which order, and what an answer
 * is worth. Plain ESM — no DOM, no store, no imports outside this directory —
 * and the random source is injected, so a run replays exactly in a test.
 */
import { askPosition, askRoute, evaluateAnswer } from "./drill.mjs";
import { setOf } from "./sets.mjs";

/** @typedef {import("./drill.mjs").Question} Question */
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
export const MODES = ["random", "grouped", "progressive", "route"];

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
 * The positions a mode draws from — all of them, or the chosen set's: a
 * practice set for `Grouped`, a first-step lane for `Route`. A set the data no
 * longer offers falls back to the mode's first one, so a stale persisted choice
 * cannot break a run.
 * @param {{oll: number, group: string, steps: number, route: {auf: string, trigger: string}[]}[]} positions
 * @param {{mode: string, set?: string|null}} options
 */
export const poolOf = (positions, { mode, set }) => {
  if (!MODES.includes(mode)) throw new Error(`unsupported mode "${mode}"`);
  if (mode !== "grouped" && mode !== "route") return [...positions];
  const chosen = setOf(positions, { mode, set });
  if (!chosen || chosen.positions.length === 0) throw new Error(`mode "${mode}" has no set "${set}"`);
  return [...chosen.positions];
};

/** Which question a mode asks of a position: one trigger, or the whole route. */
const askOf = mode => (mode === "route" ? askRoute : askPosition);

/**
 * Builds a run: every position of the mode's pool exactly once, in an order the
 * random source decides, each with its four options shuffled. Progressive walks
 * one-step, then two-step, then three-step, shuffled within each block.
 * @param {{oll: number, group: string, steps: number, route: {auf: string, trigger: string}[]}[]} positions
 * @param {{mode: string, set?: string|null, random: () => number}} options
 * @returns {Question[]} the questions
 */
export const buildRun = (positions, { mode, set, random }) => {
  const pool = poolOf(positions, { mode, set });
  const ask = askOf(mode);
  if (mode !== "progressive") return shuffle(pool, random).map(position => ask(position, random));
  const blocks = new Map();
  for (const position of pool) blocks.set(position.steps, [...(blocks.get(position.steps) ?? []), position]);
  return [...blocks.keys()].sort((a, b) => a - b)
    .flatMap(steps => shuffle(blocks.get(steps), random))
    .map(position => ask(position, random));
};

/**
 * The choices the play screen reopens with after a run: the run's own, unless
 * it was a drill — a mode the picker does not offer, so the screen falls back to
 * the default rather than showing a mode with no button pressed.
 * @param {{mode: string, hintLevel: string, set?: string|null}} run
 * @returns {{mode: string, hintLevel: string, set: string|null}}
 */
export const nextRun = ({ mode, hintLevel, set }) =>
  isBoardMode(mode)
    ? { mode, hintLevel, set: set ?? null }
    : { mode: MODES[0], hintLevel: defaultHintLevel(MODES[0]), set: null };

/**
 * How many answers an open run has taken: the questions it has moved past, plus
 * the one on screen if it has been answered. What a Skip takes back, and what
 * the confirm counts out loud.
 * @param {{index: number, given: string|string[]|null}} run
 */
export const answersOf = run => (run?.index ?? 0) + (run?.given == null ? 0 : 1);

/** How long a finished run took: the board's tie-break, never a countdown. */
export const elapsedOf = run => Math.max(0, run.finishedAt - run.startedAt);

/** Correct answers as a whole percentage, for a result screen or a stats row. */
export const accuracy = (correct, total) => (total === 0 ? 0 : Math.round((correct / total) * 100));

/**
 * Judges an answer inside a run and says what it was worth.
 * @param {Question} question
 * @param {string|string[]} given the trigger tapped, or the route built
 * @param {{index: number, total: number, score: number, streak: number, correct: number}} progress
 * @returns {{correct: boolean, expected: string|string[], points: number, streak: number, score: number, correctCount: number, complete: boolean}}
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
