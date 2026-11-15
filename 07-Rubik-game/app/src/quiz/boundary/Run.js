import BElement from "../../BElement.js";
import { html, nothing } from "lit-html";
import { answerWith, chipTapped, nextQuestion, skipRun, submitRoute } from "../control/RunControl.js";
import { evaluateAnswer, TRIGGERS } from "../core/drill.mjs";
import { answersOf } from "../core/run.mjs";
import { positionOf } from "../entity/Positions.js";
import "./Finish.js";
import { label } from "./format.js";
import { skipControl } from "./Skip.js";

/** How the four triggers read with a thumb on them. */
const TRIGGER_NAMES = {
    S: "Sune",
    AS: "Anti-Sune",
    ET: "Edge Trigger",
    WT: "Wide Edge Trigger"
};

/**
 * The run screen: one position at a time, the answer the mode asks for, progress
 * and score on top, immediate feedback. Every answer reveals the position so it
 * can be studied; the next question is one tap away.
 *
 * The trigger drills tap one of four buttons. Route mode builds a sequence from
 * the same four triggers and judges it only when the player submits it.
 *
 * Renders the core's questions; every rule lives in core/.
 */
class Run extends BElement {

    constructor() {
        super();
        // whether the skip is asking for confirmation, and which question it asked on
        this.confirmingSkip = false;
        this.confirmFor = null;
    }

    extractState({ run }) {
        const state = run ?? { phase: "idle" };
        // the confirm is about the question on screen: a new one closes it
        const here = `${state.startedAt}:${state.index}`;
        if (this.confirmFor !== here) {
            this.confirmFor = here;
            this.confirmingSkip = false;
        }
        return state;
    }

    view() {
        const run = this.state;
        if (run.phase === "running") return this.questionView(run);
        if (run.phase === "finished") return html`<q-finish></q-finish>`;
        // reached by URL rather than from the dashboard: nothing is open
        return html`
            <p class="empty" data-testid="no-open-run">
                no open run — <a href="/">back to the dashboard</a>
            </p>
        `;
    }

    questionView(run) {
        const total = run.questions.length;
        const question = run.questions[run.index];
        const position = positionOf(question.oll);
        const verdict = run.given === null ? null : evaluateAnswer(question, run.given);
        const route = question.kind === "route";
        return html`
            <article class="run" data-index="${run.index + 1}" data-total="${total}"
                     data-kind="${question.kind ?? "trigger"}">
                <header class="run-status">
                    <span class="progress">${run.index + 1} / ${total}</span>
                    <span class="mode-level">${label(run.mode)} · ${label(run.hintLevel)}</span>
                    <span class="score">${run.score} points</span>
                    ${skipControl({
                        answers: answersOf(run),
                        confirming: this.confirmingSkip,
                        onAsk: () => this.askSkip(),
                        onConfirm: () => this.skip(),
                        onCancel: () => this.cancelSkip()
                    })}
                </header>
                ${run.hintLevel === "training"
                    ? html`<p class="training-hint" data-oll="${position.oll}">
                        <span class="case-name">${position.name}</span>
                        <span>OLL ${position.oll}</span>
                    </p>`
                    : nothing}
                <img class="diagram" src="${position.image}"
                     alt="Position diagram: the top face and the ring of side stickers"
                     width="82" height="82">
                <h2>${route
                    ? "Name the route, step by step"
                    : "Which trigger solves this position?"}</h2>
                ${route ? this.routeAnswer(run) : this.triggerAnswer(question, run)}
                ${verdict
                    ? html`${this.verdictView(verdict, question)}
                        <button class="next" @click=${() => nextQuestion()}>
                            ${run.index + 1 === total ? "see the result" : "next position"}
                        </button>
                        ${this.revealView(position)}`
                    : nothing}
            </article>
        `;
    }

    /** The trigger drills: one tap answers. */
    triggerAnswer(question, run) {
        return html`
            <div class="options">
                ${question.options.map(trigger => html`
                    <button class="option ${this.mark(trigger, question, run.given)}"
                            ?disabled=${run.given !== null}
                            @click=${() => answerWith(trigger)}>
                        ${TRIGGER_NAMES[trigger]}<span class="code">${trigger}</span>
                    </button>`)}
            </div>
        `;
    }

    /**
     * Route mode: the four triggers append to a list the player can read, and
     * nothing is judged until `submit`. The list never says how many steps the
     * position has, so its length leaks only what the player themselves typed.
     */
    routeAnswer(run) {
        const open = run.given === null;
        const chips = run.chips ?? [];
        return html`
            <ol class="chosen" aria-label="Your route">
                ${chips.length === 0
                    ? html`<li class="chosen-empty">no steps yet — tap the triggers in order</li>`
                    : chips.map(trigger => html`<li class="chip">${trigger}</li>`)}
            </ol>
            <div class="options">
                ${TRIGGERS.map(trigger => html`
                    <button class="option" ?disabled=${!open} @click=${() => chipTapped(trigger)}>
                        ${TRIGGER_NAMES[trigger]}<span class="code">${trigger}</span>
                    </button>`)}
            </div>
            <button class="submit" ?disabled=${!open || chips.length === 0}
                    @click=${() => submitRoute()}>submit the route</button>
        `;
    }

    /** Asks before discarding: a Skip is never one slip of the thumb. */
    askSkip() {
        this.confirmingSkip = true;
        this.triggerViewUpdate();
    }

    cancelSkip() {
        this.confirmingSkip = false;
        this.triggerViewUpdate();
    }

    /** Skips the open run — answers withdrawn, nothing scored — and goes home. */
    skip() {
        skipRun();
        navigation.navigate("/");
    }

    /** The tapped button and the right button are marked once an answer is in. */
    mark(trigger, question, given) {
        if (given === null) return "";
        if (evaluateAnswer(question, trigger).correct) return "correct";
        return trigger === given ? "wrong" : "";
    }

    verdictView(verdict, question) {
        if (verdict.correct) {
            return html`
                <p class="verdict" role="status" data-verdict="correct">Correct.</p>
            `;
        }
        return html`
            <p class="verdict" role="status" data-verdict="incorrect">
                ${question.kind === "route"
                    ? "Not quite — the route is below, with its turns."
                    : `Not quite — the first step is ${TRIGGER_NAMES[verdict.expected]} (${verdict.expected}).`}
            </p>
        `;
    }

    /** Shown after every answer: the position, its route with its AUF turns, and the simulator. */
    revealView(position) {
        const chips = position.route.flatMap(({ auf, trigger }) =>
            auf === "none"
                ? [{ label: trigger, kind: "trigger" }]
                : [{ label: auf, kind: "auf" }, { label: trigger, kind: "trigger" }]);
        return html`
            <section class="reveal" aria-label="Position reveal" data-oll="${position.oll}" data-steps="${position.steps}">
                <h3>${position.name}</h3>
                <p class="position-meta">
                    <span>OLL ${position.oll}</span>
                    <span>${position.group}</span>
                    <span>${position.steps} ${position.steps === 1 ? "step" : "steps"}</span>
                </p>
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
