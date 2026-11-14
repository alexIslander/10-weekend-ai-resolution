import BElement from "../../BElement.js";
import { html } from "lit-html";
import { HINT_LEVEL, MODE, nameTyped, startRun } from "../control/RunControl.js";
import { positions } from "../entity/Positions.js";
import "./Run.js";
import { label } from "./format.js";

/**
 * The way in: the player types a name, then starts a run. The name is what the
 * score is recorded under, so an empty one starts nothing.
 *
 * Every run today is Random at Test; the mode and hint level pickers belong to a
 * later ticket, which is why the line below states them instead of offering them.
 */
class Play extends BElement {

    extractState({ run }) {
        return run ?? { phase: "idle", name: "" };
    }

    view() {
        if (this.state.phase !== "idle") return html`<q-run></q-run>`;
        const name = this.state.name ?? "";
        return html`
            <form class="start" @submit=${event => this.start(event)}>
                <label>Name
                    <input name="name" autocomplete="nickname" placeholder="your name" required
                           .value="${name}" @input=${event => nameTyped(event.target.value)}>
                </label>
                <p class="mode-line">${label(MODE)} · ${label(HINT_LEVEL)} · ${positions.length} positions</p>
                <button type="submit" class="start-button" ?disabled=${name.trim() === ""}>
                    start the run
                </button>
            </form>
        `;
    }

    start(event) {
        event.preventDefault();
        startRun(this.state.name ?? "");
    }
}

customElements.define('q-play', Play);
