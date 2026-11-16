/**
 * What a player's history adds up to: per-mode accuracy from finished runs, a
 * per-group rollup over the 14 groups, the weakest positions, and lifetime
 * totals. Plain ESM — no DOM, no store.
 *
 * Run with: node --test
 */
import test from "node:test";
import assert from "node:assert/strict";

import cases from "../app/src/quiz/entity/cases.json" with { type: "json" };
import { groupStats, hasHistory, modeStats, totals, worstPositions } from "../app/src/quiz/core/stats.mjs";
import { emptyRecord, recordAnswer } from "../app/src/quiz/core/records.mjs";
import { MODES } from "../app/src/quiz/core/run.mjs";

const positions = cases.positions;

const run = ({ mode = "random", hintLevel = "test", score = 100, correct = 10, total = 57, finishedAt = 1_000 } = {}) => ({
  mode, hintLevel, score, correct, total, startedAt: 0, finishedAt
});

/** A record after `attempts` answers, `correct` of them right and the rest wrong. */
const record = (attempts, correct, lastSeenAt = 500) => {
  let result = emptyRecord();
  for (let index = 0; index < attempts; index++) result = recordAnswer(result, index < correct, lastSeenAt);
  return result;
};

test("per-mode accuracy and best score come from finished runs only", () => {
  const runs = [
    run({ mode: "random", score: 100, correct: 40, total: 50 }),
    run({ mode: "random", score: 250, correct: 30, total: 50 }),
    run({ mode: "grouped", score: 30, correct: 3, total: 4 }),
    run({ mode: "random", score: 9999, correct: 50, total: 50, finishedAt: null })
  ];
  const stats = modeStats(runs);

  assert.deepEqual(stats.map(({ mode }) => mode), MODES);
  const random = stats.find(({ mode }) => mode === "random");
  assert.deepEqual(random, { mode: "random", runs: 2, accuracy: 70, best: 250 },
    "an unfinished run never counts, however good it looks");
  const grouped = stats.find(({ mode }) => mode === "grouped");
  assert.deepEqual(grouped, { mode: "grouped", runs: 1, accuracy: 75, best: 30 });
});

test("a mode never played reports no runs, no best score and zero accuracy", () => {
  const [progressive] = modeStats([]).filter(({ mode }) => mode === "progressive");
  assert.deepEqual(progressive, { mode: "progressive", runs: 0, accuracy: 0, best: 0 });
});

test("per-group accuracy covers all 14 groups in booklet order", () => {
  const records = { [positions[0].oll]: record(3, 1) };
  const rows = groupStats(positions, records);

  assert.equal(rows.length, 14);
  assert.deepEqual(rows.map(({ group }) => group), cases.groups);
  assert.deepEqual(rows.map(({ attempts }) => attempts).slice(0, 2), [3, 0]);
  assert.equal(rows[0].accuracy, 33);
  assert.equal(rows[0].correct, 1);
  assert.equal(rows[1].accuracy, 0, "a group never played reads zero, not blank");
});

test("a group's accuracy rolls up every position of that group", () => {
  const group = positions[0].group;
  const members = positions.filter(position => position.group === group);
  assert.ok(members.length > 1, "the first group carries more than one position");
  const records = {
    [members[0].oll]: record(2, 2),
    [members[1].oll]: record(2, 0)
  };
  const row = groupStats(positions, records).find(({ group: name }) => name === group);
  assert.deepEqual(row, { group, attempts: 4, correct: 2, accuracy: 50 });
});

test("the weakest positions are the ten lowest accuracies, never an untouched one", () => {
  const records = {};
  positions.slice(0, 12).forEach((position, index) => {
    records[position.oll] = record(4, index, 1_000 + index); // 0%, 25%, 50%, 75%, 100% repeating
  });
  const worst = worstPositions(positions, records, 10);

  assert.equal(worst.length, 10);
  assert.ok(worst.every(({ attempts }) => attempts > 0), "a position never asked is not a weak spot");
  const accuracies = worst.map(({ accuracy }) => accuracy);
  assert.deepEqual([...accuracies].sort((a, b) => a - b), accuracies, "worst first");
  assert.equal(accuracies[0], 0);
  assert.equal(worst[0].lastSeenAt, 1_000, "the date the position was last seen travels with the row");
  assert.ok(worst[0].name && worst[0].group, "a row can be read without looking up the position again");
});

test("equal accuracies rank the position with more attempts first", () => {
  const records = {
    [positions[0].oll]: record(2, 1),
    [positions[1].oll]: record(6, 3)
  };
  const worst = worstPositions(positions, records, 10);
  assert.deepEqual(worst.map(({ oll }) => oll), [positions[1].oll, positions[0].oll]);
});

test("a player with no records has no weakest positions", () => {
  assert.deepEqual(worstPositions(positions, {}, 10), []);
  assert.deepEqual(worstPositions(positions, undefined, 10), []);
});

test("lifetime totals count finished runs, answers given and overall accuracy", () => {
  const records = {
    [positions[0].oll]: record(3, 2),
    [positions[1].oll]: record(1, 0)
  };
  assert.deepEqual(totals(records, [run(), run({ finishedAt: null })]), { runs: 1, answered: 4, accuracy: 50 });
});

test("a player who has not answered anything yet has zero totals", () => {
  assert.deepEqual(totals({}, []), { runs: 0, answered: 0, accuracy: 0 });
});

test("a finished drill counts as practice in the totals, never in a mode's row", () => {
  const drill = run({ mode: "drill", score: 10, correct: 1, total: 1 });
  const stats = modeStats([drill]);

  assert.ok(stats.every(({ runs }) => runs === 0), "no mode table row takes a drill's score");
  assert.equal(totals({}, [drill]).runs, 1, "it is still a run the player made");
});

test("a player's history is empty only when nothing was run and nothing was answered", () => {
  assert.equal(hasHistory({ name: "ada", positions: {}, runs: [] }), false, "a name alone is not a history");
  assert.equal(hasHistory(undefined), false, "no player is an empty page too");
  assert.equal(hasHistory({ name: "ada", positions: {}, runs: [run()] }), true, "a finished run counts");
  assert.equal(
    hasHistory({ name: "ada", positions: { [positions[0].oll]: record(1, 0) }, runs: [] }),
    true, "an answer from an abandoned run is still practice");
});
