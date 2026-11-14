/**
 * Route mode asks for the whole sequence, and judges it whole: a route answer is
 * right only when it is the position's route exactly. These tests state that,
 * including the cases a sequence invites — too short, too long, right steps in
 * the wrong order, and the AUF turns that belong to the route but never to the
 * answer.
 *
 * Run with: node --test
 */
import test from "node:test";
import assert from "node:assert/strict";

import cases from "../app/src/quiz/entity/cases.json" with { type: "json" };
import { askRoute, evaluateAnswer } from "../app/src/quiz/core/drill.mjs";
import { answer, buildRun, defaultHintLevel } from "../app/src/quiz/core/run.mjs";

const positions = cases.positions;

/** A repeatable random source, so a run can be replayed test by test. */
const seeded = seed => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

/** A position as the generated file carries it, from the triggers alone. */
const positionOf = (...triggers) => ({
  oll: 99,
  name: "Test position",
  group: "Test group",
  steps: triggers.length,
  route: triggers.map(trigger => ({ auf: "none", trigger })),
});

const judge = (expected, given) => evaluateAnswer(askRoute(positionOf(...expected)), given).correct;

test("a route question asks for every step, in order", () => {
  const question = askRoute(positionOf("AS", "WT", "S"));

  assert.equal(question.kind, "route");
  assert.deepEqual(question.expected, ["AS", "WT", "S"]);
  assert.equal(question.options, undefined, "there is nothing to shuffle: the player builds the answer");
});

test("exactly the position's route is correct", () => {
  assert.equal(judge(["AS", "WT", "S"], ["AS", "WT", "S"]), true);
});

test("one step is a route: a single chip is a complete answer", () => {
  assert.equal(judge(["AS"], ["AS"]), true);
  assert.equal(judge(["AS"], ["S"]), false);
  assert.equal(judge(["AS"], []), false, "an empty answer is not a one-step route");
  assert.equal(judge(["AS"], ["AS", "AS"]), false, "repeating the step does not make it right");
});

test("a truncated route is wrong, however right its steps are", () => {
  assert.equal(judge(["AS", "WT", "S"], ["AS"]), false);
  assert.equal(judge(["AS", "WT", "S"], ["AS", "WT"]), false);
});

test("an over-long route is wrong, even with the right route on the front", () => {
  assert.equal(judge(["AS", "WT"], ["AS", "WT", "S"]), false);
});

test("the order is the answer: the right steps in the wrong order are wrong", () => {
  assert.equal(judge(["AS", "WT"], ["WT", "AS"]), false);
});

test("an AUF turn belongs to the route, never to the answer", () => {
  const withTurns = {
    oll: 98,
    name: "Turned position",
    group: "Test group",
    steps: 2,
    route: [{ auf: "none", trigger: "AS" }, { auf: "U", trigger: "WT" }],
  };
  const question = askRoute(withTurns);

  assert.deepEqual(question.expected, ["AS", "WT"], "the answer is the triggers, not the turns between them");
  assert.equal(evaluateAnswer(question, ["AS", "U", "WT"]).correct, false);
  assert.equal(evaluateAnswer(question, ["AS", "WT"]).correct, true);
});

test("a Route run asks all 57 positions, each for its own route, shuffled", () => {
  const run = buildRun(positions, { mode: "route", random: seeded(11) });

  assert.equal(run.length, 57);
  assert.equal(new Set(run.map(({ oll }) => oll)).size, 57);
  assert.ok(run.every(question => question.kind === "route"));
  for (const question of run) {
    const position = positions.find(candidate => candidate.oll === question.oll);
    assert.deepEqual(question.expected, position.route.map(step => step.trigger), `OLL ${question.oll}`);
  }
  assert.notDeepEqual(
    run.map(({ oll }) => oll),
    positions.map(({ oll }) => oll),
    "the booklet order is not the run order");
});

test("Route starts at Test, like every mode but Progressive", () => {
  assert.equal(defaultHintLevel("route"), "test");
});

test("a route answer is worth nothing until all of it is right", () => {
  const question = askRoute(positionOf("AS", "WT"));
  const progress = { index: 0, total: 57, score: 0, streak: 0, correct: 0 };

  const partial = answer(question, ["AS"], progress);
  assert.deepEqual({ correct: partial.correct, score: partial.score, streak: partial.streak }, { correct: false, score: 0, streak: 0 });

  const whole = answer(question, ["AS", "WT"], progress);
  assert.deepEqual({ correct: whole.correct, score: whole.score, streak: whole.streak }, { correct: true, score: 10, streak: 1 });
});
