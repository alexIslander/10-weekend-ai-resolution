import { createReducer } from "@reduxjs/toolkit";
import { answerGivenAction, drillStartedAction } from "../control/DrillControl.js";

/**
 * The drill's state: the question on screen and the trigger the player tapped.
 * The question comes from the core (see core/drill.mjs), so the option order
 * and the expected trigger are never recomputed in the view.
 */
const initialState = {
    question: null,
    given: null
};

export const drill = createReducer(initialState, (builder) => {
    builder.addCase(drillStartedAction, (state, { payload }) => {
        state.question = payload;
        state.given = null;
    }).addCase(answerGivenAction, (state, { payload }) => {
        state.given = payload;
    });
});
