/**
 * One random source, injected everywhere a rule needs chance. A run built with
 * the same source twice is the same run, which is what makes shuffling testable.
 */

/**
 * Fisher-Yates over a copy.
 * @template T
 * @param {T[]} items
 * @param {() => number} random returns a number in [0, 1)
 * @returns {T[]} a new, shuffled array
 */
export const shuffle = (items, random) => {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const pick = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[pick]] = [shuffled[pick], shuffled[index]];
  }
  return shuffled;
};
