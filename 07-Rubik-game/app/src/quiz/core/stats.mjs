/**
 * What a player's history adds up to: per-mode accuracy and best score from
 * finished runs, a per-group rollup over the 14 groups, the weakest positions,
 * and lifetime totals. Plain ESM — no DOM, no store.
 */
import { accuracy, MODES } from "./run.mjs";

/** A run counts once it reached its finish screen. */
const finished = run => Number.isFinite(run.finishedAt);

/**
 * Per mode: how many finished runs, their accuracy, and the best score.
 * @param {object[]} runs the player's runs
 * @returns {{mode: string, runs: number, accuracy: number, best: number}[]}
 */
export const modeStats = (runs = []) =>
  MODES.map(mode => {
    const played = runs.filter(run => run.mode === mode && finished(run));
    const total = played.reduce((sum, run) => sum + run.total, 0);
    const correct = played.reduce((sum, run) => sum + run.correct, 0);
    return {
      mode,
      runs: played.length,
      accuracy: accuracy(correct, total),
      best: played.reduce((best, run) => Math.max(best, run.score), 0)
    };
  });

/**
 * Per group, in booklet order: the rollup of its positions' records.
 * A group never played reads zero, so the table always has 14 rows.
 * @param {{oll: number, group: string}[]} positions
 * @param {Object<number, object>} records per-position records by OLL number
 * @returns {{group: string, attempts: number, correct: number, accuracy: number}[]}
 */
export const groupStats = (positions, records = {}) => {
  const rows = new Map();
  for (const position of positions) {
    const record = records?.[position.oll];
    const row = rows.get(position.group) ?? { group: position.group, attempts: 0, correct: 0 };
    row.attempts += record?.attempts ?? 0;
    row.correct += record?.correct ?? 0;
    rows.set(position.group, row);
  }
  return [...rows.values()].map(row => ({ ...row, accuracy: accuracy(row.correct, row.attempts) }));
};

/**
 * The positions worth practising: lowest accuracy first, the position with more
 * evidence first on a tie, and never one that was never asked.
 * @param {{oll: number, name: string, group: string}[]} positions
 * @param {Object<number, object>} records
 * @param {number} limit how many rows at most
 */
export const worstPositions = (positions, records = {}, limit = 10) =>
  positions
    .filter(position => (records?.[position.oll]?.attempts ?? 0) > 0)
    .map(position => {
      const record = records[position.oll];
      return {
        oll: position.oll,
        name: position.name,
        group: position.group,
        attempts: record.attempts,
        correct: record.correct,
        accuracy: accuracy(record.correct, record.attempts),
        lastSeenAt: record.lastSeenAt
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts || a.oll - b.oll)
    .slice(0, limit);

/**
 * Lifetime totals: finished runs, answers given (a position answered twice
 * counts twice) and the accuracy over those answers.
 * @param {Object<number, object>} records
 * @param {object[]} runs
 * @returns {{runs: number, answered: number, accuracy: number}}
 */
export const totals = (records = {}, runs = []) => {
  const answered = Object.values(records ?? {}).reduce((sum, record) => sum + record.attempts, 0);
  const correct = Object.values(records ?? {}).reduce((sum, record) => sum + record.correct, 0);
  return { runs: runs.filter(finished).length, answered, accuracy: accuracy(correct, answered) };
};
