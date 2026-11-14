/**
 * A board is a view of finished runs, not a second copy of them (ADR-0004):
 * one board per mode and hint level, ranked by score, ties broken by the faster
 * run. Plain ESM, no DOM, no store.
 */
import { HINT_LEVELS, MODES } from "./run.mjs";

export { HINT_LEVELS, MODES };

/** A run's duration: the tie-break on a board, never a countdown on screen. */
const elapsedOf = run => Math.max(0, run.finishedAt - run.startedAt);

const rowOf = (player, run) => ({
  name: player.name,
  score: run.score,
  correct: run.correct,
  total: run.total,
  elapsed: elapsedOf(run),
  at: run.finishedAt
});

/**
 * One board: the finished runs of this mode at this hint level, best first.
 * Equal scores rank the faster run higher; the remaining order is fixed so the
 * same runs always produce the same board.
 * @param {Object<string, {name: string, runs: object[]}>} players players by name
 * @param {{mode: string, hintLevel: string}} board which board
 */
export const boardOf = (players, { mode, hintLevel }) =>
  Object.values(players ?? {})
    .flatMap(player =>
      (player.runs ?? [])
        .filter(run => run.mode === mode && run.hintLevel === hintLevel)
        .map(run => rowOf(player, run)))
    .sort((a, b) =>
      b.score - a.score ||
      a.elapsed - b.elapsed ||
      a.at - b.at ||
      a.name.localeCompare(b.name));

/**
 * Every board the game offers today: each mode with its hint levels, in plan
 * order, so the Scores page renders data instead of deciding which boards exist.
 * @param {Object<string, {name: string, runs: object[]}>} players
 * @returns {{mode: string, boards: {hintLevel: string, rows: object[]}[]}[]}
 */
export const boardsOf = (players) =>
  MODES.map(mode => ({
    mode,
    boards: HINT_LEVELS.map(hintLevel => ({ hintLevel, rows: boardOf(players, { mode, hintLevel }) }))
  }));
