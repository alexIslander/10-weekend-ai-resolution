/**
 * What the drill promises a player: always the same four triggers as options,
 * in an order that changes, and a verdict that depends on the position's first
 * trigger alone.
 *
 * Run with: node --test
 */
import test from "node:test";
import assert from "node:assert/strict";

import { askPosition, evaluateAnswer, pickPosition, TRIGGERS } from "../app/src/quiz/core/drill.mjs";

/** A repeatable random source, so a run can be replayed test by test. */
const seeded = seed => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

/** A position as the generated file carries it: three steps, first one a two-turn ET. */
const position = {
  oll: 21,
  name: "OCLL1 (H-Shape)",
  image: "/img/friedrich-oll-12.png",
  group: "All Edges Oriented Correctly",
  steps: 3,
  route: [
    { auf: "none", trigger: "ET" },
    { auf: "U", trigger: "AS" },
    { auf: "U'", trigger: "AS" },
  ],
  simulatorUrl: "https://alg.cubing.net/?puzzle=3x3x3&setup=x&alg=y",
};

const ordersFor = seeds => seeds.map(seed => askPosition(position, seeded(seed)).options);

test("a question offers exactly the four triggers, each once", () => {
  for (const seed of [1, 2, 3, 42, 1337]) {
    const { options } = askPosition(position, seeded(seed));
    assert.equal(options.length, 4);
    assert.deepEqual([...options].sort(), [...TRIGGERS].sort());
  }
});

test("the option order follows the injected random source", () => {
  assert.deepEqual(askPosition(position, seeded(7)).options, askPosition(position, seeded(7)).options);
});

test("the option order varies from question to question", () => {
  const orders = ordersFor(Array.from({ length: 40 }, (_, index) => index));
  const distinct = new Set(orders.map(order => order.join(" ")));
  assert.ok(distinct.size > 1, "the four triggers are always offered in the same order");
  assert.ok(distinct.size > 4, `only ${distinct.size} distinct orders over 40 questions`);
});

test("the question asks for the trigger of the first step", () => {
  assert.equal(askPosition(position, seeded(1)).expected, "ET");
});

test("the first trigger is correct, any other trigger is not", () => {
  const question = askPosition(position, seeded(3));
  assert.equal(evaluateAnswer(question, "ET").correct, true);
  for (const trigger of TRIGGERS.filter(trigger => trigger !== "ET")) {
    assert.equal(evaluateAnswer(question, trigger).correct, false, trigger);
  }
});

test("a wrong answer still learns the trigger that would have been right", () => {
  const verdict = evaluateAnswer(askPosition(position, seeded(5)), "S");
  assert.deepEqual(verdict, { correct: false, expected: "ET" });
});

test("the AUF is not part of the answer in the basic drill", () => {
  const question = askPosition(position, seeded(9));
  for (const auf of ["none", "U", "U'", "U2"]) {
    assert.equal(evaluateAnswer(question, auf).correct, false, auf);
  }
});

test("an unanswered question is not a correct answer", () => {
  const question = askPosition(position, seeded(11));
  for (const nothing of [undefined, null, ""]) {
    assert.equal(evaluateAnswer(question, nothing).correct, false, String(nothing));
  }
});

test("the position under the question comes from the injected random source", () => {
  const pool = [{ oll: 21 }, { oll: 22 }, { oll: 23 }, { oll: 24 }];
  assert.equal(pickPosition(pool, () => 0).oll, 21);
  assert.equal(pickPosition(pool, () => 0.5).oll, 23);
  assert.equal(pickPosition(pool, () => 0.9999).oll, 24);
});
