import BElement from "../../BElement.js";
import { html, nothing } from "lit-html";
import { groupChosen, hintLevelChosen, modeChosen, nameTyped, startRun } from "../control/RunControl.js";
import { groupFor, HINT_LEVELS, MODES, poolOf } from "../core/run.mjs";
import { groups, positions } from "../entity/Positions.js";
import { idleState } from "../entity/RunReducer.js";
import "./Run.js";
import { label } from "./format.js";

/**
 * The way in: the player types a name, chooses a mode and hint level (and a
 * group for Grouped), then starts a run. The name is what the score is recorded
 * under, so an empty one starts nothing.
 *
 * Which positions a mode draws and in which order is the core's business; this
 * screen only offers the choices and states how many positions they mean.
 */
class Play extends BElement {

    extractState({ run }) {
        return run ?? idleState();
    }

    view() {
        if (this.state.phase !== "idle") return html`<q-run></q-run>`;
        const { name = "", mode, hintLevel } = this.state;
        const group = groupFor(groups, this.state);
        const count = poolOf(positions, { mode, group }).length;
        return html`
            <form class="start" @submit=${event => this.start(event)}>
                <label class="field">Name
                    <input name="name" autocomplete="nickname" placeholder="your name" required
                           .value="${name}" @input=${event => nameTyped(event.target.value)}>
                </label>
                <fieldset class="field">
                    <legend>Mode</legend>
                    <div class="choices">
                        ${MODES.map(option => html`
                            <button type="button" class="choice" aria-pressed="${option === mode}"
                                    @click=${() => modeChosen(option)}>${label(option)}</button>`)}
                    </div>
                </fieldset>
                ${mode === "grouped"
                    ? html`
                        <label class="field">Group
                            <select @change=${event => groupChosen(event.target.value)}>
                                ${groups.map(groupName => html`
                                    <option value="${groupName}" .selected=${groupName === group}>${groupName}</option>`)}
                            </select>
                        </label>`
                    : nothing}
                <fieldset class="field">
                    <legend>Hint level</legend>
                    <div class="choices">
                        ${HINT_LEVELS.map(level => html`
                            <button type="button" class="choice" aria-pressed="${level === hintLevel}"
                                    @click=${() => hintLevelChosen(level)}>${label(level)}</button>`)}
                    </div>
                </fieldset>
                <p class="hint-note">${this.hintNote(hintLevel)}</p>
                <p class="mode-line">${label(mode)}${mode === "grouped" ? ` · ${group}` : ""} · ${label(hintLevel)} · ${count} positions</p>
                <button type="submit" class="start-button" ?disabled=${name.trim() === ""}>
                    start the run
                </button>
            </form>
        `;
    }

    /** What the chosen hint level means, in the level's own words. */
    hintNote(hintLevel) {
        return hintLevel === "training"
            ? "The case name and OLL number stay visible while you answer."
            : "Nothing identifying is shown until you answer.";
    }

    start(event) {
        event.preventDefault();
        startRun(this.state.name ?? "");
    }
}

customElements.define('q-play', Play);
