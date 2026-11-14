/**
 * A board is a view of finished runs, not a second copy of them (ADR-0004):
 * one board per mode and hint level, ranked by score, ties broken by the faster
 * run. Plain ESM, no DOM, no store.
 */
import { elapsedOf, HINT_LEVELS, MODES } from "./run.mjs";

/** @typedef {import("./run.mjs").FinishedRun} FinishedRun */

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
 * @param {Object<string, {name: string, runs: FinishedRun[]}>} players players by name
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
 * @param {Object<string, {name: string, runs: FinishedRun[]}>} players
 * @returns {{mode: string, boards: {hintLevel: string, rows: object[]}[]}[]}
 */
export const boardsOf = (players) =>
  MODES.map(mode => ({
    mode,
    boards: HINT_LEVELS.map(hintLevel => ({ hintLevel, rows: boardOf(players, { mode, hintLevel }) }))
  }));

/**
 * A board's anchor on the scores page, so the finish screen and the page agree
 * on one spelling of it.
 * @param {{mode: string, hintLevel: string}} board which board
 */
export const boardId = ({ mode, hintLevel }) => `board-${mode}-${hintLevel}`;
