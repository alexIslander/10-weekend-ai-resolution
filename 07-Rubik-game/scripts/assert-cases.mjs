/**
 * What the booklet guarantees about the generated position file.
 *
 * One statement of the truth, used twice: the generator refuses to write a
 * file that violates it, and the browser-free tests re-check the committed
 * file. Constants below come from the booklet (14 headings, 57 positions),
 * not from the generator's own arithmetic.
 */
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const GROUP_NAMES = [
  "All Edges Oriented Correctly",
  "T-Shapes",
  "Squares",
  "C-Shapes",
  "W-Shapes",
  "Corners Correct, Edges Flipped",
  "P-Shapes",
  "I-Shapes",
  "Fish Shapes",
  "Knight Move Shapes",
  "Awkward Shapes",
  "L-Shapes",
  "Lightning Bolts",
  "No Edges Flipped Correctly",
];

/** Positions per group, in booklet order. */
export const GROUP_SIZES = [7, 2, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 8];

export const POSITION_COUNT = 57;
export const STEP_COUNTS = [[1, 4], [2, 32], [3, 21]];
export const TRIGGERS = ["S", "AS", "ET", "WT"];
export const AUFS = ["none", "U", "U'", "U2"];

const APP_ROOT = fileURLToPath(new URL("../app/src/", import.meta.url));

const fail = message => {
  throw new Error(`cases.json: ${message}`);
};

/**
 * @param {{groups: string[], positions: object[]}} cases the generated file
 * @param {{imageExists?: (image: string) => boolean}} [options] override for the
 *   diagram lookup; defaults to the app's own `img/` directory
 */
export const assertCases = (cases, { imageExists = image => existsSync(APP_ROOT + image.slice(1)) } = {}) => {
  const { positions } = cases;
  if (!Array.isArray(positions)) fail("positions is not an array");

  if (positions.length !== POSITION_COUNT) fail(`${positions.length} positions instead of ${POSITION_COUNT}`);
  if (JSON.stringify(cases.groups) !== JSON.stringify(GROUP_NAMES)) fail(`groups are not the booklet's 14 headings in booklet order`);

  const olls = positions.map(({ oll }) => oll);
  if (new Set(olls).size !== POSITION_COUNT) fail("OLL numbers are not unique");

  const sizes = GROUP_NAMES.map(name => positions.filter(position => position.group === name).length);
  if (JSON.stringify(sizes) !== JSON.stringify(GROUP_SIZES)) fail(`group sizes ${sizes.join("/")} instead of ${GROUP_SIZES.join("/")}`);
  if (sizes.reduce((sum, size) => sum + size, 0) !== POSITION_COUNT) fail("group sizes do not sum to 57");

  const stepCounts = STEP_COUNTS.map(([steps]) => positions.filter(position => position.steps === steps).length);
  if (JSON.stringify(stepCounts) !== JSON.stringify(STEP_COUNTS.map(([, count]) => count))) {
    fail(`step counts ${stepCounts.join("/")} instead of ${STEP_COUNTS.map(([, count]) => count).join("/")}`);
  }

  const images = positions.map(({ image }) => image);
  if (new Set(images).size !== POSITION_COUNT) fail("diagrams are not one per position");

  for (const position of positions) {
    const { oll, name, image, group, steps, route, simulatorUrl } = position;
    if (!GROUP_NAMES.includes(group)) fail(`OLL ${oll} has unknown group "${group}"`);
    if (typeof name !== "string" || name.trim() === "") fail(`OLL ${oll} has no case name`);
    if (!Array.isArray(route)) fail(`OLL ${oll} has no route`);
    if (route.length !== steps) fail(`OLL ${oll} has ${route.length} steps in its route but claims ${steps}`);
    if (typeof simulatorUrl !== "string" || !simulatorUrl.startsWith("https://alg.cubing.net/")) {
      fail(`OLL ${oll} has no simulator link`);
    }
    for (const step of route) {
      if (!AUFS.includes(step.auf)) fail(`OLL ${oll} has AUF "${step.auf}"`);
      if (!TRIGGERS.includes(step.trigger)) fail(`OLL ${oll} has trigger "${step.trigger}"`);
      if (typeof step.warn !== "boolean") fail(`OLL ${oll} does not say whether its step is a warn`);
      if (!Number.isInteger(step.shape) || (step.shape !== 0 && !olls.includes(step.shape))) {
        fail(`OLL ${oll} passes through shape ${step.shape}, which is not a position`);
      }
    }
    // the chain ends where it must: only the last step can reach the solved state
    if (route.at(-1).shape !== 0) fail(`OLL ${oll} does not end solved`);
    if (route.slice(0, -1).some(step => step.shape === 0)) fail(`OLL ${oll} reaches the solved state before its last step`);
    if (!imageExists(image)) fail(`OLL ${oll} references a missing diagram ${image}`);
  }
  return cases;
};
