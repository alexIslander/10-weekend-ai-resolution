import BElement from "../../BElement.js";
import { html, nothing } from "lit-html";
import { answerWith, nextQuestion, resetRun } from "../control/RunControl.js";
import { evaluateAnswer } from "../core/drill.mjs";
import { positionOf } from "../entity/Positions.js";
import "./Finish.js";

/** `test` -> `Test`, `progressive` -> `Progressive`: one rule for every mode and level. */
const label = value => (value ? value.charAt(0).toUpperCase() + value.slice(1) : "");

/** How the four triggers read with a thumb on them. */
const TRIGGER_NAMES = {
    S: "Sune",
    AS: "Anti-Sune",
    ET: "Edge Trigger",
    WT: "Wide Edge Trigger"
};

/**
 * The run screen: one position at a time, the four triggers shuffled per
 * question, progress, mode and score on top, immediate feedback. Every answer
 * reveals the position so it can be studied; the next question is one tap away.
 *
 * Renders the core's questions; every rule lives in core/run.mjs.
 */
class Run extends BElement {

    extractState({ run }) {
        return run ?? { phase: "idle" };
    }

    view() {
        const run = this.state;
        if (run.phase === "running") return this.questionView(run);
        if (run.phase === "finished") return html`<q-finish></q-finish>`;
        return nothing;
    }

    questionView(run) {
        const total = run.questions.length;
        const question = run.questions[run.index];
        const position = positionOf(question.oll);
        const verdict = run.given === null ? null : evaluateAnswer(question, run.given);
        return html`
            <article class="run" data-index="${run.index + 1}" data-total="${total}">
                <header class="run-status">
                    <span class="progress">${run.index + 1} / ${total}</span>
                    <span class="mode-level">${label(run.mode)} · ${label(run.hintLevel)}</span>
                    <span class="score">${run.score} points</span>
                </header>
                <img class="diagram" src="${position.image}"
                     alt="Position diagram: the top face and the ring of side stickers"
                     width="82" height="82">
                <h2>Which trigger solves this position?</h2>
                <div class="options">
                    ${question.options.map(trigger => html`
                        <button class="option ${this.mark(trigger, question, run.given)}"
                                ?disabled=${run.given !== null}
                                @click=${() => answerWith(trigger)}>
                            ${TRIGGER_NAMES[trigger]}<span class="code">${trigger}</span>
                        </button>`)}
                </div>
                ${verdict ? this.verdictView(verdict) : nothing}
                ${verdict ? this.revealView(position) : nothing}
                ${verdict
                    ? html`<button class="next" @click=${() => nextQuestion()}>
                        ${run.index + 1 === total ? "see the result" : "next position"}
                    </button>`
                    : nothing}
            </article>
        `;
    }

    /** The tapped button and the right button are marked once an answer is in. */
    mark(trigger, question, given) {
        if (given === null) return "";
        if (evaluateAnswer(question, trigger).correct) return "correct";
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

    /** Shown after a miss: the position, its route with its AUF turns, and the simulator. */
    revealView(position) {
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
            </section>
        `;
    }
}

customElements.define('q-run', Run);
