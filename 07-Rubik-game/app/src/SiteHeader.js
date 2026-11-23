import BElement from "./BElement.js";
import { html, nothing } from "lit-html";
import { icon } from "./icons.js";
import { cycleTheme, nextTheme, THEME_CHANGED } from "./theme.js";
import { nameTyped } from "./quiz/control/RunControl.js";
import { appVersion } from "./app.config.js";
import { showReleaseNotes } from "./ReleaseNotes.js";

/**
 * How a theme state reads on the pill, and the glyph it wears. The pill shows
 * the state a tap will give you, not the one you are in: Auto → Light → Dark.
 */
const THEME_WORDS = { auto: "Auto", light: "Light", dark: "Dark" };

/** @type {Record<"auto"|"light"|"dark", import("./icons.js").IconName>} */
const THEME_GLYPHS = { auto: "circle-half-stroke", light: "sun", dark: "moon" };

const SCREENS = [
    { path: "/", label: "play", testid: "nav-play" },
    { path: "/stats", label: "stats", testid: "nav-stats" },
    { path: "/scores", label: "scores", testid: "nav-scores" }
];

/** Whether a nav pill is the screen being looked at. */
const isHere = (path) => (path === "/" ? location.pathname === "/" : location.pathname.startsWith(path));

/**
 * The shell's header: the CSS 3x3 logo, the brand, who the next run is recorded
 * under, the theme pill and the way between the three screens.
 *
 * It is the app's only chrome that reads the store — the name is written by the
 * screens, this line only says whose it is. Nothing here decides anything: the
 * theme cycle lives in theme.js, the routes in app.js.
 */
class SiteHeader extends BElement {

    constructor() {
        super();
        // whether the name field is open: a screen concern, held by the screen
        this.editingName = false;
    }

    extractState({ run }) {
        return { name: (run?.name ?? "").trim() };
    }

    connectedCallback() {
        super.connectedCallback();
        this.onThemeChange = () => this.triggerViewUpdate();
        window.addEventListener(THEME_CHANGED, this.onThemeChange);
        // an intercepted navigation leaves the pill marking the old screen
        window.navigation?.addEventListener("navigatesuccess", () => this.triggerViewUpdate());
    }

    disconnectedCallback() {
        window.removeEventListener(THEME_CHANGED, this.onThemeChange);
        super.disconnectedCallback();
    }

    /**
     * The name a run would be recorded under. Anyone typing a name is that
     * player (a name is identity, not authentication), so the field writes
     * straight into the store and every screen follows.
     *
     * The field is a moment, not a fixture: `Enter` puts the name away, so does
     * leaving it with something typed, and an empty one does not close at all —
     * there would be nothing to read where it was.
     */
    nameField(name) {
        return html`
            <input type="text" class="name-input" data-testid="name-input" aria-label="Name"
                   autocomplete="nickname" placeholder="your name" .value=${name}
                   @input=${event => nameTyped(event.target.value)}
                   @keydown=${event => this.nameKey(event)}
                   @blur=${event => this.nameBlurred(event)}>
        `;
    }

    /** Enter closes the field; Escape puts the stored name back and closes it. */
    nameKey(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            this.closeNameField();
        }
        if (event.key === "Escape") {
            event.preventDefault();
            this.closeNameField();
        }
    }

    /**
     * Leaving the field with a name in it closes it. The `change` button is the
     * exception: its own click would otherwise close the field and immediately
     * reopen it.
     */
    nameBlurred(event) {
        const next = event.relatedTarget;
        if (next instanceof Element && next.closest('[data-testid="change-name"]')) return;
        if (this.state.name === "") return;
        this.closeNameField();
    }

    closeNameField() {
        if (!this.editingName) return;
        this.editingName = false;
        this.triggerViewUpdate();
    }

    /** Opens or closes the name field, and puts the cursor in it when it opens. */
    toggleNameField() {
        this.editingName = !this.editingName;
        this.triggerViewUpdate();
        if (this.editingName) {
            queueMicrotask(() =>
                /** @type {HTMLInputElement|null} */ (this.querySelector('[data-testid="name-input"]'))?.focus());
        }
    }

    view() {
        const { name } = this.state;
        const next = nextTheme();
        return html`
            <header class="site-header">
                <div class="header-inner">
                    <div class="header-top">
                        <a class="brand" href="/" data-testid="brand">
                            <span class="logo-grid" aria-hidden="true">
                                <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
                            </span>
                            <span class="brand-text">rubik triggers
                                <span class="brand-badge">OLL</span>
                            </span>
                        </a>
                        <div class="session">
                            ${this.editingName
                                ? this.nameField(name)
                                : html`<span class="session-name" data-testid="playing-as">
                                    ${icon("user")}${name ? `playing as ${name}` : "no name yet"}
                                </span>`}
                            <button type="button" class="theme-toggle release-toggle" data-testid="release-notes-toggle"
                                    aria-label="release notes, version ${appVersion}" title="release notes, version ${appVersion}"
                                    @click=${() => showReleaseNotes()}>
                                ${icon("circle-question")}
                            </button>
                            <button type="button" class="change-name" data-testid="change-name"
                                    aria-expanded="${this.editingName}" @click=${() => this.toggleNameField()}>
                                ${this.editingName ? "done" : name ? "change" : "add name"}
                            </button>
                            <button type="button" class="theme-toggle" data-testid="theme-toggle"
                                    data-theme-state=${next}
                                    aria-label="switch to the ${THEME_WORDS[next].toLowerCase()} theme"
                                    @click=${() => cycleTheme()}>
                                ${icon(THEME_GLYPHS[next])}<span>${THEME_WORDS[next]}</span>
                            </button>
                        </div>
                    </div>
                    <nav class="step-nav" aria-label="Screens">
                        ${SCREENS.map(({ path, label, testid }) => html`
                            <a class="nav-pill ${isHere(path) ? "active" : ""}" href="${path}"
                               data-testid="${testid}" aria-current="${isHere(path) ? "page" : "false"}">${label}</a>`)}
                    </nav>
                </div>
            </header>
        `;
    }
}

customElements.define('q-site-header', SiteHeader);
