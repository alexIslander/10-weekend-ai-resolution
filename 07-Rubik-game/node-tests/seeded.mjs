/**
 * A repeatable random source, so a run replays test by test. Not a test file:
 * `node --test` only picks up the `*.test.mjs` files beside it.
 * @param {number} seed
 * @returns {() => number} a number in [0, 1)
 */
export const seeded = seed => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};
