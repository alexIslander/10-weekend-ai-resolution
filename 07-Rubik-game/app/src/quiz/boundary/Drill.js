import BElement from "../../BElement.js";
import { html, nothing } from "lit-html";
import { answerWith, startDrill } from "../control/DrillControl.js";
import { positionOf } from "../entity/Positions.js";
import { evaluateAnswer } from "../core/drill.mjs";

/** How the four triggers read on a button. */
const TRIGGER_NAMES = {
    S: "Sune",
    AS: "Anti-Sune",
    ET: "Edge Trigger",
    WT: "Wide Edge Trigger"
};

/**
 * The drill screen: one position diagram, the four triggers in an order the
 * player has not seen, immediate feedback, then the full reveal.
 *
 * Nothing identifying is on screen before the answer — the case name, the OLL
 * number, the group and the step count appear with the reveal. Renders the
 * core's question; the rules live in core/drill.mjs.
 */
class Drill extends BElement {

    /**
     * The question lives in the store so a reload resumes it rather than
     * reshuffling the options under the player's thumb.
     */
    extractState({ drill }) {
        return drill ?? { question: null, given: null };
    }

    connectedCallback() {
        if (!this.state.question) startDrill();
        super.connectedCallback();
    }

    view() {
        const { question, given } = this.state;
        if (!question) return nothing;
        const position = positionOf(question.oll);
        const verdict = given === null ? null : evaluateAnswer(question, given);
        return html`
            <article class="drill">
                <img class="diagram" src="${position.image}"
                     alt="Position diagram: the top face and the ring of side stickers"
                     width="82" height="82">
                <h2>Which trigger solves this position?</h2>
                <div class="options">
                    ${question.options.map(trigger => html`
                        <button class="option ${this.mark(trigger, question, given)}"
                                ?disabled=${given !== null}
                                @click=${() => answerWith(trigger)}>
                            ${TRIGGER_NAMES[trigger]}<span class="code">${trigger}</span>
                        </button>`)}
                </div>
                ${verdict ? this.verdictView(verdict) : nothing}
                ${verdict ? this.revealView(position, verdict) : nothing}
            </article>
        `;
    }

    /**
     * The tapped button and the right button are marked once an answer is in,
     * so feedback is visible without reading the verdict line.
     */
    mark(trigger, question, given) {
        if (given === null) return "";
        if (trigger === question.expected) return "correct";
        return trigger === given ? "wrong" : "";
    }

    verdictView(verdict) {
        return html`
            <p class="verdict" role="status" data-verdict="${verdict.correct ? "correct" : "incorrect"}">
                ${verdict.correct
                    ? "Correct."
                    : `Not quite — the first step is ${TRIGGER_NAMES[verdict.expected]} (${verdict.expected}).`}
            </p>
        `;
    }

    revealView(position, verdict) {
        // the route reads as a sequence of chips: an AUF, then the trigger it lines up
        const chips = position.route.flatMap(({ auf, trigger }) =>
            auf === "none"
                ? [{ label: trigger, kind: "trigger" }]
                : [{ label: auf, kind: "auf" }, { label: trigger, kind: "trigger" }]);
        return html`
            <section class="reveal" aria-label="Position reveal" data-oll="${position.oll}" data-steps="${position.steps}">
                <h3>${position.name}</h3>
                <dl>
                    <dt>OLL</dt><dd>${position.oll}</dd>
                    <dt>Group</dt><dd>${position.group}</dd>
                    <dt>Steps</dt><dd>${position.steps} ${position.steps === 1 ? "step" : "steps"}</dd>
                </dl>
                <ol class="route" aria-label="Route">
                    ${chips.map((chip, index) => html`${index === 0
                        ? nothing
                        : html`<li class="arrow" aria-hidden="true">→</li>`}<li class="${chip.kind}">${chip.label}</li>`)}
                </ol>
                <a class="simulator" href="${position.simulatorUrl}" target="_blank" rel="noopener">
                    open this position in the cube simulator
                </a>
                <button class="next" @click=${() => startDrill()}>
                    ${verdict.correct ? "next position" : "try another position"}
                </button>
            </section>
        `;
    }
}

customElements.define('q-drill', Drill);
