import { createReducer } from "@reduxjs/toolkit";
import { answerGivenAction, runFinishedAction } from "../control/RunControl.js";
import { playerDeletedAction, statsResetAction } from "../control/PlayersControl.js";
import { recordAnswer } from "../core/records.mjs";

/**
 * What the game remembers about a player: one record per name, holding the
 * per-position records and one entry per finished run. Boards are derived from
 * those finished runs, never stored twice.
 *
 * A name is identity, not authentication: typing an existing name adopts its
 * history.
 */
export const players = createReducer({}, (builder) => {
    builder.addCase(answerGivenAction, (state, { payload: { name, question, outcome, at } }) => {
        const player = state[name] ??= { name, positions: {}, runs: [] };
        player.positions[question.oll] = recordAnswer(player.positions[question.oll], outcome.correct, at);
    }).addCase(runFinishedAction, (state, { payload: { name, ...finishedRun } }) => {
        const player = state[name] ??= { name, positions: {}, runs: [] };
        player.runs.push(finishedRun);
    }).addCase(statsResetAction, (state, { payload: name }) => {
        // the name stays: the next run and the next board row are written under it
        if (state[name]) state[name] = { name, positions: {}, runs: [] };
    }).addCase(playerDeletedAction, (state, { payload: name }) => {
        delete state[name];
    });
});
