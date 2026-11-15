/**
 * How one answer changes what the game remembers about a position. Written as
 * a pure function so the next run's order can be judged from records alone.
 */

/**
 * What the game remembers about one position.
 * @typedef {{attempts: number, correct: number, wrong: number, lastSeenAt: number|null, streak: number}} PositionRecord
 */

/** @typedef {{name: string, positions: Object<number, PositionRecord>, runs: Object[]}} Player */

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

/**
 * A player's position records as they stand, copied: what a Skip has to put
 * back (ADR-0005). Taken when a run starts, because afterwards nothing can tell
 * which answers belonged to which run.
 * @param {Player|undefined} player
 * @returns {Object<number, PositionRecord>}
 */
export const snapshotRecords = (player) => structuredClone(player?.positions ?? {});

/**
 * The player with a skipped run's answers taken back out: the records are the
 * snapshot's again, and the finished runs are the player's own — a Skip is a
 * property of an open run and touches nothing that was ever scored.
 * @param {Player} player
 * @param {Object<number, PositionRecord>} snapshot
 * @returns {Player}
 */
export const withoutAnswers = (player, snapshot) => ({
  ...player,
  positions: structuredClone(snapshot ?? {}),
});
