/**
 * The theme is a stored choice of three states, cycling Auto → Light → Dark
 * (ADR-0006). It is deliberately not in the store: the store hydrates with the
 * module graph, which would paint white first, and a key of its own survives
 * `reset stats` and `delete player`.
 *
 * The first paint is not this module's job — the inline script in index.html
 * resolves the stored state and sets `data-theme` before any stylesheet is
 * applied. This module owns everything after that: the cycle, the key, the
 * `theme-color` hint, and keeping `Auto` honest when the OS flips.
 */

/** Where the choice is kept. The only localStorage key besides the store's. */
export const THEME_KEY = "rubik-theme";

/** A theme state as the player chose it. @typedef {"auto"|"light"|"dark"} ThemeState */

/** The cycle, in order: the pill shows the state it will switch to. @type {ThemeState[]} */
export const THEME_STATES = ["auto", "light", "dark"];

/** Fired on `window` whenever the resolved theme changes, so the pill can repaint. */
export const THEME_CHANGED = "rubik-theme-changed";

/**
 * The page background per theme, mirrored from tokens.css: a `<meta>` tag cannot
 * read a custom property, and the browser paints its own chrome from this.
 */
const PAGE_COLOUR = { light: "#f4f6f9", dark: "#0b0f19" };

/** @returns {MediaQueryList} the OS preference, read through one instance */
const osPreference = () => window.matchMedia("(prefers-color-scheme: dark)");

/**
 * Whether a stored string is one of the three states.
 * @param {unknown} value
 * @returns {value is ThemeState}
 */
const isThemeState = (value) => THEME_STATES.some((state) => state === value);

/**
 * The state the player chose, or `auto`: a key that holds something else — an
 * older build, a hand-edited value — is no choice at all.
 * @returns {ThemeState}
 */
export const storedTheme = () => {
    try {
        const stored = localStorage.getItem(THEME_KEY);
        return isThemeState(stored) ? stored : "auto";
    } catch {
        // storage can be denied; the default is still a theme
        return "auto";
    }
};

/**
 * What a state means on screen: `auto` defers to the OS, the other two are
 * themselves.
 * @param {ThemeState} [state]
 * @returns {"light"|"dark"}
 */
export const resolvedTheme = (state = storedTheme()) =>
    state === "auto" ? (osPreference().matches ? "dark" : "light") : state;

/**
 * The state one tap away, in cycle order: auto → light → dark → auto.
 * @param {ThemeState} [state]
 * @returns {ThemeState}
 */
export const nextTheme = (state = storedTheme()) =>
    THEME_STATES[(THEME_STATES.indexOf(state) + 1) % THEME_STATES.length];

/**
 * Puts a state on the document: `data-theme` and `color-scheme` for the
 * stylesheet and the form controls, plus the browser-chrome colour.
 * @param {ThemeState} [state]
 * @returns {"light"|"dark"} the theme now showing
 */
export const applyTheme = (state = storedTheme()) => {
    const theme = resolvedTheme(state);
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", PAGE_COLOUR[theme]);
    window.dispatchEvent(new CustomEvent(THEME_CHANGED, { detail: { state, theme } }));
    return theme;
};

/**
 * One tap of the pill: stores the next state and applies it.
 * @returns {ThemeState} the state now stored
 */
export const cycleTheme = () => {
    const state = nextTheme();
    try {
        localStorage.setItem(THEME_KEY, state);
    } catch {
        // a denied write leaves the choice for this page only
    }
    applyTheme(state);
    return state;
};

// `Auto` means "whatever the OS says", so an OS flip repaints while it is chosen.
// Registered once, at load: the module graph is loaded once per page.
if (typeof window !== "undefined") {
    osPreference().addEventListener("change", () => {
        if (storedTheme() === "auto") applyTheme("auto");
    });
}
