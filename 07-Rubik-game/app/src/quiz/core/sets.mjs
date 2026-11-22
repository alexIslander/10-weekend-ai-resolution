/**
 * The pools a run draws from when the mode is narrower than all 57 positions.
 *
 * A `Grouped` run takes a **practice set**: one booklet group, or several
 * adjacent ones, never fewer than six positions — a two-position group is a
 * lookup, not a rehearsal. A `Route` run takes a **first-step lane**: every
 * position whose route opens with one trigger, the way the booklet's route map
 * cuts the same 57 cases.
 *
 * Plain ESM: no DOM, no store, no imports outside this directory. Both are
 * derived from the committed position file on every call, so a change in the
 * booklet reaches the picker without a second table to keep in step.
 */
import { TRIGGERS, TRIGGER_NAMES } from "./drill.mjs";

/**
 * The smallest pool worth practising: below this a set is a handful of cards
 * the player already knows, not a drill.
 */
export const MIN_SET_SIZE = 6;

/**
 * A named pool of positions, as the picker offers it and the run draws it.
 * @typedef {{id: string, label: string, count: number, positions: object[]}} Set
 */

/**
 * The booklet's groups rolled up into practice sets, in booklet order.
 *
 * Groups are walked in the order the position file prints them and a set closes
 * as soon as it holds six positions, so the 14 headings become eight sets of
 * 6–8. A short tail — impossible in today's booklet, possible in the next —
 * folds into the set before it rather than standing alone.
 *
 * A set of one group keeps that group's name; a set of several names them all,
 * so the picker never invents a family name the booklet does not use.
 * @param {{group: string}[]} positions the committed file, in booklet order
 * @returns {Set[]}
 */
export const practiceSets = positions => {
  const raw = [];
  let current = null;
  for (const position of positions) {
    // a set closes at a group boundary, never inside one: a group of eight is a
    // set, not six positions and a stray pair
    if (!current || (current.groups.at(-1) !== position.group && current.positions.length >= MIN_SET_SIZE)) {
      current = { groups: [], positions: [] };
      raw.push(current);
    }
    if (current.groups.at(-1) !== position.group) current.groups.push(position.group);
    current.positions.push(position);
  }
  const last = raw.at(-1);
  if (raw.length > 1 && last.positions.length < MIN_SET_SIZE) {
    const previous = raw.at(-2);
    previous.groups.push(...last.groups);
    previous.positions.push(...last.positions);
    raw.pop();
  }
  return raw.map(({ groups, positions: members }) => {
    const label = groups.join(" · ");
    return { id: label, label, count: members.length, positions: members };
  });
};

/** The trigger a position's route opens with: what a Route lane is cut by. */
export const firstTriggerOf = position => position.route[0]?.trigger;

/**
 * Route's first-step lanes: every position, then one lane per trigger, in the
 * four triggers' order. The booklet's route map groups the same way, and its
 * counts are asserted by the tests, so a data change shows up as a red test.
 * @param {{route: {trigger: string}[]}[]} positions
 * @returns {Set[]}
 */
export const routeSets = positions => [
  { id: "all", label: "All positions", count: positions.length, positions },
  ...TRIGGERS.map(trigger => {
    const lane = positions.filter(position => firstTriggerOf(position) === trigger);
    return {
      id: trigger,
      label: `Starts with ${TRIGGER_NAMES[trigger]} (${trigger})`,
      count: lane.length,
      positions: lane
    };
  })
];

/**
 * The sets a mode offers: practice sets for `Grouped`, first-step lanes for
 * `Route`, nothing for a mode that asks everything.
 * @param {string} mode
 * @param {object[]} positions
 * @returns {Set[]}
 */
export const setsOf = (mode, positions) => {
  if (mode === "grouped") return practiceSets(positions);
  if (mode === "route") return routeSets(positions);
  return [];
};

/**
 * The set a run uses. A stored choice the data no longer offers — a group name
 * from before the sets existed, or a mode that has no sets — falls back to the
 * mode's first set, so a stale persisted choice cannot break the picker.
 * @param {object[]} positions
 * @param {{mode?: string, set?: string|null}} run
 * @returns {Set|null}
 */
export const setOf = (positions, { mode, set }) => {
  const offered = setsOf(mode, positions);
  return offered.find(option => option.id === set) ?? offered[0] ?? null;
};
