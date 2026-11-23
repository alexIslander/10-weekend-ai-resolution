import BElement from "./BElement.js";
import { html } from "lit-html";
import { icon } from "./icons.js";
import { releaseNotes } from "./release-notes.js";

/** Opening the notes from anywhere: the header's `?` button. */
const SHOW = "rubik:show-release-notes";

/**
 * What changed, and in which version — the answer to "is this the build I read
 * about?", one tap from anywhere.
 *
 * It is the same modal `<dialog>` the name gate uses, for the same reasons: a
 * real dialog traps focus, and `<dialog>` keeps the page behind it inert without
 * the app tracking that. The list is `release-notes.js`; this file only draws it.
 */
export const showReleaseNotes = () => window.dispatchEvent(new CustomEvent(SHOW));

class ReleaseNotes extends BElement {

    constructor() {
        super();
        // closed until asked for: the notes are a reference, not a greeting
        this.open = false;
    }

    connectedCallback() {
        super.connectedCallback();
        this.onShow = () => this.show();
        window.addEventListener(SHOW, this.onShow);
    }

    disconnectedCallback() {
        window.removeEventListener(SHOW, this.onShow);
        super.disconnectedCallback();
    }

    show() {
        this.open = true;
        this.triggerViewUpdate();
    }

    close() {
        this.open = false;
        this.triggerViewUpdate();
    }

    /**
     * Reconciles the `<dialog>` with `open` after every render: `showModal` is
     * the browser's modality, not a class, so it is called here rather than
     * expressed in the template.
     */
    triggerViewUpdate() {
        super.triggerViewUpdate();
        const dialog = /** @type {HTMLDialogElement|null} */ (this.querySelector("dialog"));
        if (!dialog) return;
        if (this.open && !dialog.open) {
            dialog.showModal();
        } else if (!this.open && dialog.open) {
            dialog.close();
        }
    }

    view() {
        return html`
            <dialog class="gate notes" data-testid="release-notes" aria-labelledby="notes-title"
                    @close=${() => { if (this.open) this.close(); }}
                    @cancel=${event => { event.preventDefault(); this.close(); }}>
                <div class="gate-card">
                    <p class="gate-eyebrow">${icon("circle-question")} release notes</p>
                    <h2 id="notes-title">what changed</h2>
                    ${releaseNotes.map(release => html`
                        <section class="release" data-testid="release-${release.version}">
                            <h3 class="release-version">version ${release.version}</h3>
                            <ul class="release-changes">
                                ${release.changes.map(change => html`<li>${change}</li>`)}
                            </ul>
                        </section>`)}
                    <div class="gate-actions">
                        <button type="button" class="start-button" data-testid="notes-close"
                                @click=${() => this.close()}>${icon("check")} got it</button>
                    </div>
                </div>
            </dialog>
        `;
    }
}

customElements.define('q-release-notes', ReleaseNotes);
