/** How the screens write the core's numbers: no rules here, only presentation. */

/** `test` -> `Test`, `random` -> `Random`: one rule for every mode and hint level. */
export const label = value => (value ? value.charAt(0).toUpperCase() + value.slice(1) : "");

/** A finish date as the player reads it: local, stable, sortable. */
export const date = milliseconds => {
    const finished = new Date(milliseconds);
    const pad = value => String(value).padStart(2, "0");
    return `${finished.getFullYear()}-${pad(finished.getMonth() + 1)}-${pad(finished.getDate())}`;
};

/** Elapsed time as a player reads it, never as a countdown (ADR-0004). */
export const duration = milliseconds => {
    const seconds = Math.max(0, Math.round(milliseconds / 1000));
    const minutes = Math.floor(seconds / 60);
    return minutes === 0 ? `${seconds} s` : `${minutes} min ${seconds % 60} s`;
};
