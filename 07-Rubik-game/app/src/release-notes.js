/**
 * What each release changed, newest first — the one place a version number is
 * written down. The header's `?` button renders this list; `appVersion` in
 * app.config.js is the newest entry's version, so a release is a new first item
 * here and one edit there.
 *
 * One line per change, in the player's words: what it does for them, not which
 * module moved. Dates are left out on purpose — a release note is about what
 * changed, and the deploy log already knows when.
 */
import { appVersion } from "./app.config.js";

/** @typedef {{ version: string, changes: string[] }} Release */

/** @type {Release[]} */
export const releaseNotes = [
    {
        version: appVersion,
        changes: [
            "a first visit is asked for a name, because a score belongs to someone",
            "the dashboard teaches the game: how it works, and the four triggers with their formulas",
            "Grouped draws practice sets of six to eight positions instead of the whole booklet",
            "Route picks its lane — all positions, or one first step — and counts what each lane holds",
            "Route draws its map above the answer, filled in once you submit",
            "this dialog: the version you are playing, and what it changed"
        ]
    },
    {
        version: "1.0",
        changes: [
            "the first deployment: a position, four triggers, one tap",
            "four modes — Random, Grouped, Progressive, Route — each at Training or Test",
            "a scored run of 57 positions, with the streak ladder and the finish screen",
            "a board per mode and hint level, built from finished runs, on the scores page",
            "the stats page: accuracy per mode and group, the ten weak spots, lifetime totals",
            "an open run survives a reload, and skipping one leaves no record behind",
            "the guide's design system: light, dark or auto, on a phone in portrait"
        ]
    }
];
