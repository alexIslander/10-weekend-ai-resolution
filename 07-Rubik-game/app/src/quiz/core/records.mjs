/**
 * How one answer changes what the game remembers about a position. Written as
 * a pure function so the next run's order can be judged from records alone.
 */

/** A position the player has never answered. */
export const emptyRecord = () => ({ attempts: 0, correct: 0, wrong: 0, lastSeenAt: null, streak: 0 });

/**
 * @param {{attempts: number, correct: number, wrong: number, lastSeenAt: number|null, streak: number}|undefined} record
 * @param {boolean} correct
 * @param {number} at timestamp of the answer
 */
export const recordAnswer = (record, correct, at) => {
  const previous = record ?? emptyRecord();
  return {
    attempts: previous.attempts + 1,
    correct: previous.correct + (correct ? 1 : 0),
    wrong: previous.wrong + (correct ? 0 : 1),
    lastSeenAt: at,
    streak: correct ? previous.streak + 1 : 0,
  };
};
