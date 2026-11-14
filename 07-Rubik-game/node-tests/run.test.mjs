/**
 * What a scored run promises: every position once, a ladder that rewards a
 * streak and punishes a miss, and a run that ends exactly after the last
 * position.
 *
 * Run with: node --test
 */
import test from "node:test";
import assert from "node:assert/strict";

import cases from "../app/src/quiz/entity/cases.json" with { type: "json" };
import { buildRun, answer } from "../app/src/quiz/core/run.mjs";
import { emptyRecord, recordAnswer } from "../app/src/quiz/core/records.mjs";

const positions = cases.positions;

/** A repeatable random source, so a run can be replayed test by test. */
const seeded = seed => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

const start = { index: 0, total: 57, score: 0, streak: 0 };

/** Answers a question correctly and returns the progress after it. */
const step = (progress, question) => {
  const outcome = answer(question, question.expected, progress);
  return { index: progress.index + 1, total: progress.total, score: outcome.score, streak: outcome.streak };
};

test("a Random run asks each of the 57 positions exactly once", () => {
  const run = buildRun(positions, { mode: "random", random: seeded(1) });
  assert.equal(run.length, 57);
  assert.equal(new Set(run.map(({ oll }) => oll)).size, 57);
  assert.deepEqual(run.map(({ oll }) => oll).sort((a, b) => a - b), positions.map(({ oll }) => oll).sort((a, b) => a - b));
});

test("a Random run is shuffled, and the same random source replays the same order", () => {
  const bookletOrder = positions.map(({ oll }) => oll);
  const first = buildRun(positions, { mode: "random", random: seeded(7) }).map(({ oll }) => oll);
  const replay = buildRun(positions, { mode: "random", random: seeded(7) }).map(({ oll }) => oll);
  const other = buildRun(positions, { mode: "random", random: seeded(8) }).map(({ oll }) => oll);

  assert.deepEqual(first, replay);
  assert.notDeepEqual(first, other);
  assert.notDeepEqual(first, bookletOrder, "the booklet's order is not a shuffled order");
});

test("every question carries the four triggers as options", () => {
  const run = buildRun(positions, { mode: "random", random: seeded(3) });
  for (const question of run) {
    assert.equal(question.options.length, 4);
    assert.deepEqual([...question.options].sort(), ["AS", "ET", "S", "WT"]);
    assert.equal(question.expected, positions.find(({ oll }) => oll === question.oll).route[0].trigger);
  }
});

test("an unknown mode is refused instead of silently guessing", () => {
  assert.throws(() => buildRun(positions, { mode: "grouped", random: seeded(1) }), /unsupported mode/);
});

test("consecutive correct answers are worth 10, 20, 30, 40, then 50 points", () => {
  const question = { oll: 26, expected: "AS" };
  let progress = start;
  const points = [];
  for (let count = 0; count < 6; count++) {
    const outcome = answer(question, "AS", progress);
    points.push(outcome.points);
    progress = { index: progress.index + 1, total: 57, score: outcome.score, streak: outcome.streak };
  }
  assert.deepEqual(points, [10, 20, 30, 40, 50, 50], "the multiplier caps at 5");
});

test("a wrong answer scores nothing and puts the ladder back at the first rung", () => {
  const question = { oll: 26, expected: "AS" };
  let progress = start;
  for (let count = 0; count < 4; count++) progress = step(progress, question);
  assert.deepEqual(progress, { index: 4, total: 57, score: 100, streak: 4 });

  const miss = answer(question, "S", progress);
  assert.equal(miss.correct, false);
  assert.equal(miss.points, 0);
  assert.equal(miss.streak, 0);
  assert.equal(miss.score, 100, "a miss never subtracts");

  const next = answer(question, "AS", { index: 5, total: 57, score: miss.score, streak: miss.streak });
  assert.equal(next.points, 10, "the next correct answer starts again at 10");
});

test("a miss reports the trigger that would have been right", () => {
  const question = { oll: 26, expected: "AS" };
  const miss = answer(question, "ET", start);
  assert.deepEqual(miss, { correct: false, expected: "AS", points: 0, streak: 0, score: 0, complete: false });
});

test("the run is complete exactly after the last position", () => {
  const run = buildRun(positions, { mode: "random", random: seeded(5) });
  let progress = { index: 0, total: run.length, score: 0, streak: 0 };
  run.forEach((question, index) => {
    const outcome = answer(question, question.expected, progress);
    assert.equal(outcome.complete, index === run.length - 1, `question ${index + 1}`);
    progress = { index: progress.index + 1, total: run.length, score: outcome.score, streak: outcome.streak };
  });
  // four answers build the ladder (10+20+30+40), the remaining 53 are at the cap
  assert.equal(progress.score, 100 + 53 * 50);
});

test("a missed position is not asked again in the same run", () => {
  const run = buildRun(positions, { mode: "random", random: seeded(9) });
  const missed = run[0].oll;
  answer(run[0], run[0].expected === "S" ? "AS" : "S", start);
  assert.equal(run.filter(({ oll }) => oll === missed).length, 1);
});

test("a fresh per-position record starts empty", () => {
  assert.deepEqual(emptyRecord(), { attempts: 0, correct: 0, wrong: 0, lastSeenAt: null, streak: 0 });
});

test("each answer updates the position's record: attempts, correct, wrong, last seen, streak", () => {
  const seen = new Date("2026-11-14T14:00:00.000Z").getTime();
  const once = recordAnswer(emptyRecord(), true, seen);
  assert.deepEqual(once, { attempts: 1, correct: 1, wrong: 0, lastSeenAt: seen, streak: 1 });

  const twice = recordAnswer(once, false, seen + 1000);
  assert.deepEqual(twice, { attempts: 2, correct: 1, wrong: 1, lastSeenAt: seen + 1000, streak: 0 });

  assert.deepEqual(recordAnswer(undefined, true, seen), once, "a position never seen before needs no special casing");
});
