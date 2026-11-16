/**
 * A Skip takes a run's answers back out of the player's records and leaves
 * everything else alone (ADR-0005). The promise is a round trip — the records a
 * run started with are the records a skip restores — so the rules are written as
 * plain functions and proved here without a browser or a store.
 *
 * Run with: node --test
 */
import test from "node:test";
import assert from "node:assert/strict";

import { emptyRecord, recordAnswer, snapshotRecords, withoutAnswers } from "../app/src/quiz/core/records.mjs";
import { answersOf } from "../app/src/quiz/core/run.mjs";

const at = 1_760_000_000_000;

/** A player with two positions answered and one finished run in the books. */
const player = () => ({
  name: "ada",
  positions: {
    21: recordAnswer(emptyRecord(), true, at),
    34: recordAnswer(emptyRecord(), false, at),
  },
  runs: [{ mode: "random", hintLevel: "test", score: 120, correct: 40, total: 57, startedAt: at, finishedAt: at + 30_000 }],
});

/** Answers a position inside one run and returns the player it writes into. */
const answerIn = (owner, oll, correct, seen) => ({
  ...owner,
  positions: { ...owner.positions, [oll]: recordAnswer(owner.positions[oll], correct, seen) },
});

test("a snapshot is a copy: answers given after it do not change it", () => {
  const before = player();
  const snapshot = snapshotRecords(before);

  const after = answerIn(before, 21, true, at + 1_000);

  assert.deepEqual(snapshot, before.positions);
  assert.equal(snapshot[21].attempts, 1);
  assert.equal(after.positions[21].attempts, 2, "the run's own answer still lands in the record while it is open");
  assert.notEqual(after.positions[21], snapshot[21], "the snapshot is not a window on the live records");
});

test("three answers, a snapshot, two more, then a skip: the records are the snapshot again", () => {
  const owner = { name: "ada", positions: {}, runs: [] };
  const runAnswers = [
    [21, true], [34, false], [12, true],
  ];
  let during = owner;
  for (const [oll, correct] of runAnswers) during = answerIn(during, oll, correct, at);

  const snapshot = snapshotRecords(owner);
  assert.deepEqual(snapshot, {}, "a player with nothing answered snapshots to nothing");

  for (const [oll, correct] of [[21, false], [48, true]]) during = answerIn(during, oll, correct, at + 1);
  assert.equal(Object.keys(during.positions).length, 4, "five answers, four positions");

  const skipped = withoutAnswers(during, snapshot);

  assert.deepEqual(skipped.positions, snapshot, "every answer the run collected is gone");
  assert.deepEqual(skipped.positions, {}, "and nothing is invented in its place");
  assert.equal(skipped.name, "ada", "the name survives the skip");
});

test("a skip restores an earlier record exactly, not a hollow one", () => {
  const owner = player();
  const snapshot = snapshotRecords(owner);

  // the open run answers the same positions again, and one it had never seen
  let during = answerIn(owner, 21, false, at + 5_000);
  during = answerIn(during, 34, true, at + 6_000);
  during = answerIn(during, 48, true, at + 7_000);

  const skipped = withoutAnswers(during, snapshot);

  assert.deepEqual(skipped.positions[21], owner.positions[21], "an attempt, a wrong answer and a streak come back out");
  assert.deepEqual(skipped.positions[34], owner.positions[34]);
  assert.equal(skipped.positions[48], undefined, "a position the run introduced leaves no row behind");
});

test("a skip never touches a finished run", () => {
  const owner = player();
  const skipped = withoutAnswers(answerIn(owner, 21, true, at + 1_000), snapshotRecords(owner));

  assert.deepEqual(skipped.runs, owner.runs, "the history is not the open run's to spend");
  assert.equal(skipped.runs.length, 1);
});

test("answersOf counts answers, not questions: the question on screen counts once it is answered", () => {
  assert.equal(answersOf({ index: 0, given: null }), 0);
  assert.equal(answersOf({ index: 0, given: "S" }), 1);
  assert.equal(answersOf({ index: 3, given: null }), 3, "three answered and moved past");
  assert.equal(answersOf({ index: 3, given: "S" }), 4, "the fourth is answered and still on screen");
  assert.equal(answersOf({ index: 2, given: ["AS", "WT"] }), 3, "a route answer counts once");
});
