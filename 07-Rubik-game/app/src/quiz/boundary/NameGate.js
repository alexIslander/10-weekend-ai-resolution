import BElement from "../../BElement.js";
import { html } from "lit-html";
import { nameTyped } from "../control/RunControl.js";
import { icon } from "../../icons.js";

/** Opening the gate from anywhere: the dashboard's prompt, the header's button. */
const ASK = "rubik:ask-name";

/**
 * Asks for a name, from wherever a screen has a reason to.
 *
 * A name is the only identity this app has — it is what a score is filed under
 * — so a first arrival has nothing to see until it knows one. `askForName`
 * opens the gate over whatever screen is up; the gate closes itself the moment
 * the store holds a name.
 */
export const askForName = () => window.dispatchEvent(new CustomEvent(ASK));

/**
 * The first-visit gate: one question, one field, no account behind it.
 *
 * It is a real modal `<dialog>` (focus trapped, the page behind it inert) rather
 * than a styled overlay, and it opens once per page load: a first arrival is
 * asked immediately, a returning player whose stored name is still there never
 * sees it. `later` dismisses it for this visit — the dashboard keeps its own
 * "add your name" prompt, and the header keeps its field — so nobody is trapped
 * by a dialog they did not ask for.
 *
 * Nothing is dispatched while the player types: the field's value is read on
 * submit, so writing a name is one store change, not one per keystroke, and the
 * gate cannot re-render under the keyboard.
 */
class NameGate extends BElement {

    constructor() {
        super();
        // the gate is open by default on a page load with no name, and only then
        this.open = false;
    }

    extractState({ run }) {
        return { name: (run?.name ?? "").trim() };
    }

    connectedCallback() {
        super.connectedCallback();
        this.onAsk = () => this.show();
        window.addEventListener(ASK, this.onAsk);
        // the first paint decides: a page loaded without a name asks for one
        if (!this.state.name) this.show();
    }

    disconnectedCallback() {
        window.removeEventListener(ASK, this.onAsk);
        super.disconnectedCallback();
    }

    /** Opens the gate and puts the caret in the field. */
    show() {
        this.open = true;
        this.triggerViewUpdate();
    }

    /** Closes it for this visit, leaving the dashboard's own prompt in place. */
    close() {
        this.open = false;
        this.triggerViewUpdate();
    }

    /** Writes the typed name — the one store change this dialog makes. */
    submit(event) {
        event.preventDefault();
        const field = /** @type {HTMLInputElement|null} */ (this.querySelector('[data-testid="gate-name"]'));
        const name = (field?.value ?? "").trim();
        if (!name) {
            field?.focus();
            return;
        }
        nameTyped(name);
        this.close();
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
        if (this.open && this.state.name === "" && !dialog.open) {
            dialog.showModal();
            /** @type {HTMLInputElement|null} */ (dialog.querySelector("input"))?.focus();
        } else if (dialog.open && (!this.open || this.state.name !== "")) {
            dialog.close();
        }
    }

    view() {
        return html`
            <dialog class="gate" data-testid="name-gate" aria-labelledby="gate-title"
                    @close=${() => { if (this.open) this.close(); }}
                    @cancel=${event => { event.preventDefault(); this.close(); }}>
                <form class="gate-card" @submit=${event => this.submit(event)}>
                    <p class="gate-eyebrow">${icon("user")} welcome</p>
                    <h2 id="gate-title">what should we call you?</h2>
                    <p class="gate-lede">
                        A name is the only identity here: it is what a score is filed
                        under. No account, no password, nothing leaves this browser.
                    </p>
                    <label class="field">Name
                        <input type="text" class="name-input" data-testid="gate-name"
                               autocomplete="nickname" placeholder="your name" required>
                    </label>
                    <div class="gate-actions">
                        <button type="submit" class="start-button" data-testid="gate-continue">
                            ${icon("play")} start practising
                        </button>
                        <button type="button" class="gate-later" data-testid="gate-later"
                                @click=${() => this.close()}>later</button>
                    </div>
                </form>
            </dialog>
        `;
    }
}

customElements.define('q-name-gate', NameGate);
