import { createAction } from "@reduxjs/toolkit";
import store from "../../store.js";

export const statsResetAction = createAction("statsResetAction");
export const playerDeletedAction = createAction("playerDeletedAction");

/**
 * Clears a player's per-position records and finished runs, keeping the name:
 * a clean slate under the same identity, so the boards drop the old scores and
 * the next run starts from zero.
 * @param {string} name the player to reset
 * @returns {boolean} whether a reset was asked for
 */
export const resetStats = (name) => {
    const player = (name ?? "").trim();
    if (!player) return false;
    store.dispatch(statsResetAction(player));
    return true;
}

/**
 * Removes a player entirely: no records, no runs, and therefore no row on any
 * board, and the name the next run would be recorded under is forgotten too —
 * the device keeps no trace of a player who was deleted. Typing the name again
 * makes a new player.
 * @param {string} name the player to delete
 * @returns {boolean} whether a deletion was asked for
 */
export const deletePlayer = (name) => {
    const player = (name ?? "").trim();
    if (!player) return false;
    store.dispatch(playerDeletedAction(player));
    return true;
}
