import { createAction } from "@reduxjs/toolkit";
import store from "../../store.js";
import { askPosition, pickPosition } from "../core/drill.mjs";
import { positions } from "../entity/Positions.js";

export const drillStartedAction = createAction("drillStartedAction");
export const answerGivenAction = createAction("answerGivenAction");

/**
 * Puts one position on screen as a question. The random source is a parameter
 * so a drill can be replayed in a test; the player's browser passes its own.
 * @param {() => number} [random]
 */
export const startDrill = (random = Math.random) => {
    const position = pickPosition(positions, random);
    store.dispatch(drillStartedAction(askPosition(position, random)));
}

/**
 * Records the trigger the player tapped. Answering is final for this position;
 * a new question is started with startDrill().
 * @param {string} trigger one of S, AS, ET, WT
 */
export const answerWith = (trigger) => {
    store.dispatch(answerGivenAction(trigger));
}
