/** How the screens write the core's numbers: no rules here, only presentation. */

/** `test` -> `Test`, `random` -> `Random`: one rule for every mode and hint level. */
export const label = value => (value ? value.charAt(0).toUpperCase() + value.slice(1) : "");

/** A finish date as the player reads it: local, stable, sortable. */
export const date = milliseconds => {
    const finished = new Date(milliseconds);
    const pad = value => String(value).padStart(2, "0");
    return `${finished.getFullYear()}-${pad(finished.getMonth() + 1)}-${pad(finished.getDate())}`;
};

/** A core accuracy as a player reads it, e.g. `33%`. */
export const percentage = value => `${value}%`;

/** Elapsed time as a player reads it, never as a countdown (ADR-0004). */
export const duration = milliseconds => {
    const seconds = Math.max(0, Math.round(milliseconds / 1000));
    const minutes = Math.floor(seconds / 60);
    return minutes === 0 ? `${seconds} s` : `${minutes} min ${seconds % 60} s`;
};

/**
 * How long ago a moment was, as the dashboard reads it: `just now`,
 * `4 minutes ago`, `3 weeks ago`. Coarse on purpose — it is a nudge about an
 * open run, not a clock, so it never needs a smaller unit than a minute.
 */
export const ago = (milliseconds, now = Date.now()) => {
    if (!Number.isFinite(milliseconds)) return "just now";
    const minutes = Math.floor(Math.max(0, now - milliseconds) / 60_000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
};
