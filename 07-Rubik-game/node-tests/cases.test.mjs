/**
 * The committed position file is data: these tests read it as a consumer
 * would, and state what the booklet guarantees about it.
 *
 * Run with: node --test node-tests
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { assertCases, AUFS, GROUP_NAMES, GROUP_SIZES, TRIGGERS } from "../scripts/assert-cases.mjs";

const APP_ROOT = fileURLToPath(new URL("../app/src/", import.meta.url));
const cases = JSON.parse(readFileSync(new URL("../app/src/quiz/entity/cases.json", import.meta.url), "utf8"));

const positions = cases.positions;
const groupOf = position => position.group;

test("the generated file holds the booklet's 57 positions", () => {
  assert.equal(positions.length, 57);
  assert.deepEqual(cases.groups, GROUP_NAMES);
});

test("positions are in booklet order: 14 groups of 7/2/2/2/2/2/4/4/4/4/4/6/6/8", () => {
  const sizes = GROUP_NAMES.map(name => positions.filter(position => groupOf(position) === name).length);
  assert.deepEqual(sizes, GROUP_SIZES);
  assert.deepEqual(sizes.reduce((sum, size) => sum + size, 0), 57);

  const runs = positions.reduce((acc, position) => {
    if (acc.at(-1) !== groupOf(position)) acc.push(groupOf(position));
    return acc;
  }, []);
  assert.deepEqual(runs, GROUP_NAMES, "each group is printed as one contiguous block");
});

test("every position has a unique OLL number and a case name", () => {
  const olls = positions.map(position => position.oll);
  assert.equal(new Set(olls).size, 57);
  assert.deepEqual([...olls].sort((a, b) => a - b), Array.from({ length: 57 }, (_, index) => index + 1));
  for (const position of positions) assert.ok(position.name.trim().length > 0, `OLL ${position.oll} has no case name`);
});

test("step counts split 4 / 32 / 21", () => {
  const counts = positions.reduce((acc, { steps }) => acc.set(steps, (acc.get(steps) ?? 0) + 1), new Map());
  assert.deepEqual([...counts].sort(([a], [b]) => a - b), [[1, 4], [2, 32], [3, 21]]);
});

test("every route has exactly as many steps as the position claims", () => {
  for (const position of positions) {
    assert.equal(position.route.length, position.steps, `OLL ${position.oll}`);
  }
});

test("every step has a trigger and an AUF from the allowed set", () => {
  const aufs = new Set();
  const triggers = new Set();
  for (const { oll, route } of positions) {
    for (const step of route) {
      assert.deepEqual(Object.keys(step).sort(), ["auf", "shape", "trigger", "warn"], `OLL ${oll} step shape`);
      assert.ok(AUFS.includes(step.auf), `OLL ${oll} has AUF "${step.auf}"`);
      assert.ok(TRIGGERS.includes(step.trigger), `OLL ${oll} has trigger "${step.trigger}"`);
      aufs.add(step.auf);
      triggers.add(step.trigger);
    }
  }
  assert.deepEqual([...triggers].sort(), [...TRIGGERS].sort(), "all four triggers occur");
  assert.deepEqual([...aufs].sort(), [...AUFS].sort(), "every AUF form occurs");
});

test("every referenced diagram exists in the app and no image is shared", () => {
  const images = positions.map(position => position.image);
  assert.equal(new Set(images).size, 57, "one diagram per position");
  for (const image of images) {
    assert.match(image, /^\/img\/friedrich-oll-\d+\.png$/, `unexpected image path ${image}`);
    assert.ok(existsSync(APP_ROOT + image.slice(1)), `missing diagram ${image}`);
  }
});

test("the app holds no diagram that no position references", () => {
  const referenced = positions.map(({ image }) => image.split("/").pop());
  const present = readdirSync(`${APP_ROOT}img`).filter(name => /^friedrich-oll-\d+\.png$/.test(name));
  assert.deepEqual(present.sort(), [...referenced].sort(), "stale diagrams: regenerate the position data");
});

test("the diagram comes from the fixture's mapping, never from the OLL number", () => {
  const imageOf = oll => positions.find(position => position.oll === oll).image;
  // friedrich-oll-NN.png is not OLL case NN; these three are known-good anchors.
  assert.equal(imageOf(26), "/img/friedrich-oll-10.png");
  assert.equal(imageOf(21), "/img/friedrich-oll-12.png");
  assert.equal(imageOf(1), "/img/friedrich-oll-16.png");
});

test("every position links to the simulator at its own setup", () => {
  for (const position of positions) {
    const url = new URL(position.simulatorUrl);
    assert.equal(url.origin, "https://alg.cubing.net");
    assert.equal(url.searchParams.get("puzzle"), "3x3x3");
    assert.ok(url.searchParams.get("setup"), `OLL ${position.oll} has no setup`);
    assert.ok(url.searchParams.get("alg"), `OLL ${position.oll} has no alg`);
  }
});

test("the generator's own assertions accept the committed file", () => {
  assert.doesNotThrow(() => assertCases(cases, { imageExists: image => existsSync(APP_ROOT + image.slice(1)) }));
});

test("the route map's checkpoints are real positions, and only the last step is solved", () => {
  const byOll = new Map(positions.map(position => [position.oll, position]));
  for (const position of positions) {
    for (const [index, step] of position.route.entries()) {
      const last = index === position.route.length - 1;
      if (last) {
        assert.equal(step.shape, 0, `OLL ${position.oll} does not end solved`);
        continue;
      }
      const checkpoint = byOll.get(step.shape);
      assert.ok(checkpoint, `OLL ${position.oll} passes through OLL ${step.shape}, which is not a case`);
      assert.ok(existsSync(APP_ROOT + checkpoint.image.slice(1)),
        `OLL ${position.oll}'s checkpoint ${step.shape} has no diagram`);
      assert.equal(step.warn, false, "today's booklet marks no checkpoint as a warn");
    }
  }
  // the shape the guide's route map draws is the one the game draws
  const twoStep = positions.find(({ oll }) => oll === 24);
  assert.equal(twoStep.route[0].shape, 26, "OCLL4 (T-Shape) lands on OCLL6 first");
  assert.equal(twoStep.route[1].shape, 0);
});
