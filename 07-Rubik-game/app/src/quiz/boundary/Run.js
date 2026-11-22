import BElement from "../../BElement.js";
import { html, nothing } from "lit-html";
import { answerWith, chipTapped, nextQuestion, skipRun, submitRoute } from "../control/RunControl.js";
import { evaluateAnswer, TRIGGERS, TRIGGER_NAMES } from "../core/drill.mjs";
import { answersOf } from "../core/run.mjs";
import { positionOf } from "../entity/Positions.js";
import "./Finish.js";
import { icon } from "../../icons.js";
import { label } from "./format.js";
import { skipControl } from "./Skip.js";

/**
 * The square a typed step carries on the route chips: one cube colour per
 * trigger, fixed here so a chip reads the same wherever a route is shown. The
 * answer buttons never wear these colours — an answer is neutral (ADR-0006).
 */
const TRIGGER_TILES = {
    S: "yellow",
    AS: "blue",
    ET: "green",
    WT: "orange"
};

/**
 * The run screen: one position at a time, the answer the mode asks for, progress
 * and score on top, immediate feedback. Every answer reveals the position so it
 * can be studied; the next question is one tap away.
 *
 * The trigger drills tap one of four buttons. Route mode builds a sequence from
 * the same four triggers and judges it only when the player submits it.
 *
 * Dressed in the guide's components (ADR-0006): the question on a `.card`, the
 * diagram as a white sticker, the answer as a neutral `.move-card`, the verdict
 * as the guide's check or cross, and the reveal as its yellow solving note.
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
            <article class="card run" data-testid="run" data-index="${run.index + 1}"
                     data-total="${total}" data-kind="${question.kind ?? "trigger"}"
                     data-oll="${position.oll}">
                <header class="run-status" data-testid="run-status">
                    <span class="pill" data-testid="run-progress">${run.index + 1} / ${total}</span>
                    <span class="pill" data-testid="run-mode-level">${label(run.mode)} · ${label(run.hintLevel)}</span>
                    <span class="pill" data-testid="run-score">${run.score} points</span>
                    ${skipControl({
                        answers: answersOf(run),
                        confirming: this.confirmingSkip,
                        onAsk: () => this.askSkip(),
                        onConfirm: () => this.skip(),
                        onCancel: () => this.cancelSkip()
                    })}
                </header>
                ${run.hintLevel === "training"
                    ? html`<p class="training-hint" data-testid="training-hint" data-oll="${position.oll}">
                        <span class="case-name">${position.name}</span>
                        <span>OLL ${position.oll}</span>
                    </p>`
                    : nothing}
                <div class="cube-wrapper">
                    <span class="cube-frame">
                        <img class="diagram" data-testid="diagram" src="${position.image}"
                             alt="Position diagram: the top face and the ring of side stickers"
                             width="82" height="82">
                    </span>
                </div>
                <h2 class="section-title" data-testid="question">${route
                    ? "Name the route, step by step"
                    : "Which trigger solves this position?"}</h2>
                ${route ? this.chainView(run, question) : nothing}
                ${route ? this.routeAnswer(run) : this.triggerAnswer(question, run)}
                ${verdict
                    ? html`${this.verdictView(verdict, question)}
                        ${this.revealView(position)}
                        <button class="next" data-testid="next" @click=${() => nextQuestion()}>
                            ${run.index + 1 === total ? "see the result" : "next position"}
                        </button>`
                    : nothing}
            </article>
        `;
    }

    /** The trigger drills: one tap answers. */
    triggerAnswer(question, run) {
        return html`
            <div class="answers" data-testid="answers">
                ${question.options.map(trigger => html`
                    <button class="move-card" data-testid="answer-${trigger}"
                            data-state="${this.mark(trigger, question, run.given) || "idle"}"
                            ?disabled=${run.given !== null}
                            @click=${() => answerWith(trigger)}>
                        <span class="move-name">${TRIGGER_NAMES[trigger]}</span>
                        <span class="move-code">${trigger}</span>
                    </button>`)}
            </div>
        `;
    }

    /**
     * Route mode's map: the shapes the route walks through, with a box between
     * them for each trigger to go in.
     *
     * This is the scaffold that makes a route answerable — the diagram on screen
     * says where the route starts, not what it passes through, and a three-step
     * route was otherwise invisible until it was wrong. The boxes stay empty
     * until the route is submitted (the answer is still typed in the chips
     * below, and still judged whole); the next one is marked so the player can
     * see where they are. At Training each checkpoint also carries its case
     * name; at Test the shapes carry nothing but themselves (ADR-0002).
     *
     * The checkpoints are recognition aids, not shortcuts: the booklet's `warn`
     * flag marks a shape whose own row needs more steps than the lane has left,
     * and it is surfaced at Training because that is the case a learner would
     * get wrong by jumping.
     */
    chainView(run, question) {
        const position = positionOf(question.oll);
        const submitted = run.given !== null;
        const typed = run.chips ?? [];
        const training = run.hintLevel === "training";
        return html`
            <div class="chain-block" data-testid="route-chain" data-steps="${position.steps}">
                <p class="chain-caption" data-testid="chain-caption">
                    route map · ${position.steps} ${position.steps === 1 ? "step" : "steps"} —
                    ${submitted ? "the route, with its AUF turns" : "name each trigger in order"}
                </p>
                <div class="chain-scroll">
                    <ol class="chain" aria-label="Route map">
                        ${position.route.map((step, index) => html`
                            ${index === 0 ? nothing : html`<li class="chain-arrow" aria-hidden="true">→</li>`}
                            ${this.chainStep(step, index, { submitted, next: typed.length })}
                            ${this.chainShape(step, training)}`)}
                    </ol>
                </div>
            </div>
        `;
    }

    /** One box of the chain: the trigger that takes this shape to the next. */
    chainStep(step, index, { submitted, next }) {
        const state = submitted ? "given" : index === next ? "next" : "todo";
        return html`
            <li class="chain-cell chain-step" data-testid="chain-step" data-index="${index + 1}"
                data-state="${state}">
                ${submitted
                    ? html`<span class="chain-alg">${step.auf === "none" ? "" : `${step.auf} + `}${step.trigger}</span>`
                    : html`<span class="chain-n">${index + 1}</span>`}
            </li>
        `;
    }

    /** The shape the cube is in after that trigger, or the solved badge after the last. */
    chainShape(step, training) {
        if (step.shape === 0) {
            return html`
                <li class="chain-cell chain-solved" data-testid="chain-solved">
                    ${icon("check")}<span>solved</span>
                </li>
            `;
        }
        const shape = positionOf(step.shape);
        return html`
            <li class="chain-cell chain-shape" data-testid="chain-shape"
                data-oll="${step.shape}" data-warn="${step.warn}">
                <span class="chain-frame">
                    <img class="chain-diagram" src="${shape.image}" width="44" height="44"
                         alt="${training ? shape.name : "checkpoint shape"}">
                </span>
                ${training
                    ? html`<span class="chain-label" title="${shape.name}">${shape.name}</span>`
                    : nothing}
                ${step.warn && training
                    ? html`<span class="chain-warn" title="this lane continues past the shape: follow the route, not that case's row">!</span>`
                    : nothing}
            </li>
        `;
    }

    /**
     * Route mode: the four triggers append to a list the player can read, and
     * nothing is judged until `submit` — the map above says which shape each
     * step reaches, the chips below are the answer being typed.
     */
    routeAnswer(run) {
        const open = run.given === null;
        const chips = run.chips ?? [];
        return html`
            <ol class="chosen" data-testid="chosen" aria-label="Your route">
                ${chips.length === 0
                    ? html`<li class="chosen-empty">no steps yet — tap the triggers in order</li>`
                    : chips.map(trigger => html`
                        <li class="chosen-step" data-testid="chosen-step">
                            <span class="tile tile--${TRIGGER_TILES[trigger]}" aria-hidden="true"></span>${trigger}
                        </li>`)}
            </ol>
            <div class="answers">
                ${TRIGGERS.map(trigger => html`
                    <button class="move-card" data-testid="answer-${trigger}"
                            data-state="idle" ?disabled=${!open}
                            @click=${() => chipTapped(trigger)}>
                        <span class="move-name">${TRIGGER_NAMES[trigger]}</span>
                        <span class="move-code">${trigger}</span>
                    </button>`)}
            </div>
            <button class="submit" data-testid="submit-route" ?disabled=${!open || chips.length === 0}
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

    /**
     * The tapped button and the right button are marked once an answer is in,
     * in the neutral tones of a notation card: the verdict badge carries the
     * green or the red, never an answer button.
     */
    mark(trigger, question, given) {
        if (given === null) return "";
        if (evaluateAnswer(question, trigger).correct) return "correct";
        return trigger === given ? "wrong" : "";
    }

    /** The guide's verdict: a green check, or a red cross, and the sentence beneath it. */
    verdictView(verdict, question) {
        const result = verdict.correct ? "correct" : "incorrect";
        return html`
            <p class="verdict" role="status" data-testid="verdict" data-result="${result}">
                <span class="verdict-badge verdict-badge--${result}" aria-hidden="true">
                    ${icon(verdict.correct ? "check" : "xmark")}
                </span>
                <span>${verdict.correct
                    ? "Correct."
                    : question.kind === "route"
                        ? "Not quite — the route is below, with its turns."
                        : `Not quite — the first step is ${TRIGGER_NAMES[verdict.expected]} (${verdict.expected}).`}</span>
            </p>
        `;
    }

    /**
     * The reveal: the guide's yellow solving note, carrying the case name, the
     * OLL number, the group, the step count, the route with its AUF turns, and
     * the way into the simulator.
     */
    revealView(position) {
        const chips = position.route.flatMap(({ auf, trigger }) =>
            auf === "none"
                ? [{ label: trigger, kind: "trigger" }]
                : [{ label: auf, kind: "auf" }, { label: trigger, kind: "trigger" }]);
        return html`
            <section class="solve-note" aria-label="Position reveal" data-testid="reveal"
                     data-oll="${position.oll}" data-steps="${position.steps}">
                <p class="solve-note-label">solving note</p>
                <h3>${position.name}</h3>
                <p class="position-meta">
                    <span>OLL ${position.oll}</span>
                    <span>${position.group}</span>
                    <span>${position.steps} ${position.steps === 1 ? "step" : "steps"}</span>
                </p>
                <ol class="route" data-testid="reveal-route" aria-label="Route">
                    ${chips.map((chip, index) => html`${index === 0
                        ? nothing
                        : html`<li class="arrow" aria-hidden="true">→</li>`}<li
                        class="route-step route-step--${chip.kind}" data-testid="reveal-step"
                        data-kind="${chip.kind}">${chip.label}</li>`)}
                </ol>
                <a class="simulator" data-testid="simulator" href="${position.simulatorUrl}"
                   target="_blank" rel="noopener">
                    open this position in the cube simulator
                </a>
            </section>
        `;
    }
}

customElements.define('q-run', Run);
