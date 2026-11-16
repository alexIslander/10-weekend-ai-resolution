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
import { groups, positions as generatedPositions } from "../app/src/quiz/entity/Positions.js";
import { accuracy, buildRun, answer, defaultHintLevel, DRILL, groupFor, isBoardMode, MODES, nextRun, poolOf } from "../app/src/quiz/core/run.mjs";
import { emptyRecord, recordAnswer } from "../app/src/quiz/core/records.mjs";
import { seeded } from "./seeded.mjs";

const positions = cases.positions;

const start = { index: 0, total: 57, score: 0, streak: 0, correct: 0 };

/** Answers a question correctly and returns the progress after it. */
const step = (progress, question) => {
  const outcome = answer(question, question.expected, progress);
  return {
    index: progress.index + 1,
    total: progress.total,
    score: outcome.score,
    streak: outcome.streak,
    correct: outcome.correctCount
  };
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

test("the options come in a different order from question to question", () => {
  const run = buildRun(positions, { mode: "random", random: seeded(4) });
  const orders = new Set(run.map(({ options }) => options.join(" ")));
  assert.ok(orders.size > 1, "the four triggers were offered in one fixed order");
});

test("accuracy is a whole percentage of the questions asked", () => {
  assert.equal(accuracy(0, 57), 0);
  assert.equal(accuracy(56, 57), 98);
  assert.equal(accuracy(57, 57), 100);
  assert.equal(accuracy(0, 0), 0);
});

test("an unknown mode is refused instead of silently guessing", () => {
  assert.throws(() => buildRun(positions, { mode: "endless", random: seeded(1) }), /unsupported mode/);
});

test("consecutive correct answers are worth 10, 20, 30, 40, then 50 points", () => {
  const question = { oll: 26, expected: "AS" };
  let progress = start;
  const points = [];
  for (let count = 0; count < 6; count++) {
    const outcome = answer(question, "AS", progress);
    points.push(outcome.points);
    progress = { ...progress, index: progress.index + 1, score: outcome.score, streak: outcome.streak, correct: outcome.correctCount };
  }
  assert.deepEqual(points, [10, 20, 30, 40, 50, 50], "the multiplier caps at 5");
});

test("a wrong answer scores nothing and puts the ladder back at the first rung", () => {
  const question = { oll: 26, expected: "AS" };
  let progress = start;
  for (let count = 0; count < 4; count++) progress = step(progress, question);
  assert.deepEqual(progress, { index: 4, total: 57, score: 100, streak: 4, correct: 4 });

  const miss = answer(question, "S", progress);
  assert.equal(miss.correct, false);
  assert.equal(miss.points, 0);
  assert.equal(miss.streak, 0);
  assert.equal(miss.score, 100, "a miss never subtracts");

  const next = answer(question, "AS", { index: 5, total: 57, score: miss.score, streak: miss.streak, correct: 4 });
  assert.equal(next.points, 10, "the next correct answer starts again at 10");
});

test("a miss reports the trigger that would have been right", () => {
  const question = { oll: 26, expected: "AS" };
  const miss = answer(question, "ET", start);
  assert.deepEqual(miss, { correct: false, expected: "AS", points: 0, streak: 0, score: 0, correctCount: 0, complete: false });
});

test("the run is complete exactly after the last position", () => {
  const run = buildRun(positions, { mode: "random", random: seeded(5) });
  let progress = { index: 0, total: run.length, score: 0, streak: 0, correct: 0 };
  run.forEach((question, index) => {
    const outcome = answer(question, question.expected, progress);
    assert.equal(outcome.complete, index === run.length - 1, `question ${index + 1}`);
    progress = { ...progress, index: progress.index + 1, score: outcome.score, streak: outcome.streak, correct: outcome.correctCount };
  });
  // four answers build the ladder (10+20+30+40), the remaining 53 are at the cap
  assert.equal(progress.score, 100 + 53 * 50);
  assert.equal(progress.correct, 57);
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

test("the group picker lists the 14 groups the data carries, in booklet order", () => {
  assert.deepEqual(generatedPositions, positions, "the entity hands out the generated file's positions");
  assert.equal(groups.length, 14);
  assert.deepEqual(groups, cases.groups);
  assert.deepEqual(groups.slice(0, 3), ["All Edges Oriented Correctly", "T-Shapes", "Squares"]);
  // every group is used, so the picker never offers an empty run
  const used = new Set(positions.map(position => position.group));
  assert.deepEqual([...used].sort(), [...groups].sort());
});

test("a Grouped run asks exactly the positions of the chosen group, shuffled", () => {
  const group = "T-Shapes";
  const inGroup = positions.filter(position => position.group === group).map(({ oll }) => oll);
  const run = buildRun(positions, { mode: "grouped", group, random: seeded(2) });
  const replay = buildRun(positions, { mode: "grouped", group, random: seeded(2) });

  assert.equal(run.length, inGroup.length);
  assert.deepEqual(run.map(({ oll }) => oll).sort((a, b) => a - b), [...inGroup].sort((a, b) => a - b));
  assert.deepEqual(run.map(({ oll }) => oll), replay.map(({ oll }) => oll));
  assert.notDeepEqual(run.map(({ oll }) => oll), inGroup, "the group is shuffled, not in booklet order");
});

test("every group's pool is exactly that group's positions", () => {
  const sizes = groups.map(group => poolOf(positions, { mode: "grouped", group }).length);
  assert.deepEqual(sizes, [7, 2, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 8]);
});

test("an unknown group is refused", () => {
  assert.throws(() => buildRun(positions, { mode: "grouped", group: "Nope", random: seeded(1) }), /unsupported group/);
  assert.throws(() => buildRun(positions, { mode: "grouped", random: seeded(1) }), /unsupported group/);
});

test("a Progressive run walks one-step, then two-step, then three-step, shuffled within each block", () => {
  const run = buildRun(positions, { mode: "progressive", random: seeded(6) });
  const replay = buildRun(positions, { mode: "progressive", random: seeded(6) });
  const steps = run.map(({ oll }) => positions.find(position => position.oll === oll).steps);

  assert.equal(run.length, 57);
  assert.deepEqual([...steps].sort((a, b) => a - b), steps, "step counts never go backwards");
  assert.deepEqual([4, 32, 21], [1, 2, 3].map(count => steps.filter(step => step === count).length));
  assert.deepEqual(run.map(({ oll }) => oll), replay.map(({ oll }) => oll));

  const firstBlock = run.slice(0, 4).map(({ oll }) => oll);
  const bookletOneStep = positions.filter(({ steps: count }) => count === 1).map(({ oll }) => oll);
  assert.deepEqual([...firstBlock].sort((a, b) => a - b), [...bookletOneStep].sort((a, b) => a - b));
  assert.notDeepEqual(firstBlock, bookletOneStep, "the one-step block is shuffled too");
});

test("a non-grouped run asks all 57 positions whatever group is offered", () => {
  assert.equal(poolOf(positions, { mode: "random", group: "T-Shapes" }).length, 57);
  assert.equal(poolOf(positions, { mode: "progressive" }).length, 57);
});

test("Progressive starts at Training, every other mode at Test", () => {
  assert.equal(defaultHintLevel("progressive"), "training");
  assert.equal(defaultHintLevel("random"), "test");
  assert.equal(defaultHintLevel("grouped"), "test");
});

test("a grouped choice falls back to the first group when it is missing or stale", () => {
  assert.equal(groupFor(groups, { mode: "random" }), undefined, "a mode that asks everything has no group");
  assert.equal(groupFor(groups, { mode: "grouped", group: null }), groups[0]);
  assert.equal(groupFor(groups, { mode: "grouped", group: "T-Shapes" }), "T-Shapes");
  assert.equal(groupFor(groups, { mode: "grouped", group: "A group the booklet dropped" }), groups[0]);
});

test("every shipped mode is a board mode, and a drill is not", () => {
  assert.deepEqual(MODES.filter(isBoardMode), MODES, "every mode the picker offers lands on a board");
  assert.equal(isBoardMode(DRILL), false, "a drill never does");
});

test("the play screen reopens with the run's own choices", () => {
  assert.deepEqual(
    nextRun({ mode: "grouped", hintLevel: "training", group: "T-Shapes" }),
    { mode: "grouped", hintLevel: "training", group: "T-Shapes" });
  assert.deepEqual(
    nextRun({ mode: "progressive", hintLevel: "test", group: null }),
    { mode: "progressive", hintLevel: "test", group: null });
});

test("a drill hands the play screen back to the default mode and level", () => {
  // the picker has no Drill button, so the screen must not reopen on one
  assert.deepEqual(
    nextRun({ mode: DRILL, hintLevel: "test", group: null }),
    { mode: "random", hintLevel: "test", group: null });
});
