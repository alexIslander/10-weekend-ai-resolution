/**
 * The pools the picker offers: practice sets for `Grouped`, first-step lanes
 * for `Route`. What these tests protect is the promise the screen makes — a
 * Grouped run is never a two-card lookup, and a Route lane is exactly the
 * positions that open with the trigger its name gives.
 *
 * Run with: node --test
 */
import test from "node:test";
import assert from "node:assert/strict";

import cases from "../app/src/quiz/entity/cases.json" with { type: "json" };
import { MIN_SET_SIZE, firstTriggerOf, practiceSets, routeSets, setOf, setsOf } from "../app/src/quiz/core/sets.mjs";

const positions = cases.positions;

test("the booklet's 14 groups become eight practice sets of six to eight positions", () => {
  const sets = practiceSets(positions);
  assert.equal(sets.length, 8);
  assert.deepEqual(sets.map(set => set.count), [7, 6, 8, 8, 8, 6, 6, 8]);
  assert.ok(sets.every(set => set.count >= MIN_SET_SIZE), "no set is a lookup");
  assert.equal(sets.reduce((sum, set) => sum + set.count, 0), 57, "every position is in exactly one set");
});

test("a set never repeats a position and never repeats a group name", () => {
  const seen = new Set();
  for (const set of practiceSets(positions)) {
    for (const position of set.positions) {
      assert.equal(seen.has(position.oll), false, `OLL ${position.oll} belongs to one set`);
      seen.add(position.oll);
    }
    const groups = set.id.split(" · ");
    assert.equal(new Set(groups).size, groups.length, `${set.id} names a group twice`);
  }
  assert.equal(seen.size, 57);
});

test("every set is a run of neighbouring booklet groups, in booklet order", () => {
  const order = cases.groups;
  let previous = -1;
  for (const set of practiceSets(positions)) {
    const indices = set.id.split(" · ").map(name => order.indexOf(name));
    assert.ok(indices.every(index => index >= 0), `${set.id} names a group the booklet does not have`);
    assert.deepEqual(indices, [...indices].sort((a, b) => a - b), `${set.id} is out of booklet order`);
    assert.equal(indices[0], previous + 1, `${set.id} does not continue where the last set stopped`);
    previous = indices.at(-1);
  }
  assert.equal(previous, order.length - 1, "the sets stop at the booklet's last group");
});

test("a set of one group keeps that group's name; a set of several names them all", () => {
  const sets = practiceSets(positions);
  assert.equal(sets[0].id, "All Edges Oriented Correctly");
  assert.equal(sets.find(set => set.id === "L-Shapes").count, 6);
  const merged = sets.find(set => set.id === "T-Shapes · Squares · C-Shapes");
  assert.deepEqual(merged.positions.map(position => position.group).filter((group, index, all) => all.indexOf(group) === index),
    ["T-Shapes", "Squares", "C-Shapes"]);
});

test("a group of eight stays one set instead of splitting into six and a stray pair", () => {
  const eight = practiceSets(positions).find(set => set.positions[0].group === "No Edges Flipped Correctly");
  assert.equal(eight.count, 8);
  assert.equal(eight.id, "No Edges Flipped Correctly");
});

test("a short tail folds into the set before it rather than standing alone", () => {
  // today's booklet ends on eight; a smaller one could leave four at the end
  const synthetic = [
    ...Array.from({ length: 7 }, (_, index) => ({ oll: index + 1, group: "A" })),
    ...Array.from({ length: 2 }, (_, index) => ({ oll: index + 8, group: "B" })),
    ...Array.from({ length: 2 }, (_, index) => ({ oll: index + 10, group: "C" }))
  ];
  const sets = practiceSets(synthetic);
  assert.deepEqual(sets.map(set => set.count), [11], "the four-position tail joins the set before it");
  assert.equal(sets[0].id, "A · B · C");
});

test("Route's first-step lanes are the booklet's four blocks plus all of them", () => {
  const lanes = routeSets(positions);
  assert.deepEqual(lanes.map(lane => lane.id), ["all", "S", "AS", "ET", "WT"]);
  assert.deepEqual(lanes.map(lane => lane.count), [57, 12, 8, 18, 19]);
  assert.equal(lanes.slice(1).reduce((sum, lane) => sum + lane.count, 0), 57, "the four lanes partition the positions");
});

test("a lane holds exactly the positions whose route opens with its trigger", () => {
  const seen = new Set();
  for (const lane of routeSets(positions).slice(1)) {
    for (const position of lane.positions) {
      assert.equal(firstTriggerOf(position), lane.id, `OLL ${position.oll} is in the wrong lane`);
      assert.equal(seen.has(position.oll), false, `OLL ${position.oll} is in two lanes`);
      seen.add(position.oll);
    }
  }
  assert.equal(seen.size, 57);
});

test("a mode that asks everything offers no set, and Route's default is all of them", () => {
  assert.deepEqual(setsOf("random", positions), []);
  assert.deepEqual(setsOf("progressive", positions), []);
  assert.equal(setOf(positions, { mode: "random", set: "all" }), null);
  assert.equal(setOf(positions, { mode: "route", set: null }).id, "all");
  assert.equal(setOf(positions, { mode: "grouped", set: "all" }).id, "All Edges Oriented Correctly",
    "a lane's id is not a practice set");
});
