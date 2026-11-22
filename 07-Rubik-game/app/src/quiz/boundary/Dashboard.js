import BElement from "../../BElement.js";
import { html, nothing } from "lit-html";
import { hintLevelChosen, modeChosen, setChosen, skipRun, startRun } from "../control/RunControl.js";
import { TRIGGER_NAMES } from "../core/drill.mjs";
import { answersOf, defaultHintLevel, HINT_LEVELS, poolOf } from "../core/run.mjs";
import { setOf, setsOf } from "../core/sets.mjs";
import { modeStats } from "../core/stats.mjs";
import { positions } from "../entity/Positions.js";
import { idleState } from "../entity/RunReducer.js";
import { icon } from "../../icons.js";
import { askForName } from "./NameGate.js";
import { ago, label, percentage } from "./format.js";
import { skipControl } from "./Skip.js";

/** A week: past this, an open run is old enough that skipping is offered first. */
const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * The four modes that ship, each with the colour and glyph ADR-0006 reserves for
 * it, and the rule it plays by in one line — the card should answer "what would
 * this mode ask me?" before it is tapped.
 */
const MODE_CARDS = [
    { mode: "random", colour: "yellow", glyph: "shuffle", rule: "all 57, shuffled" },
    { mode: "grouped", colour: "blue", glyph: "layer-group", rule: "one practice set" },
    { mode: "progressive", colour: "green", glyph: "arrow-trend-up", rule: "one step, then two, then three" },
    { mode: "route", colour: "orange", glyph: "route", rule: "the whole route" }
];

/**
 * The four triggers as the guide names them, with the formula each one applies.
 * The game asks which trigger; this table is the only place the screen spells
 * one out, so a learner can read what the four codes on the buttons mean.
 */
const TRIGGER_TABLE = [
    { code: "S", name: TRIGGER_NAMES.S, alg: "R U R' U R U2' R'", what: "turns the last corner a Sune's way round" },
    { code: "AS", name: TRIGGER_NAMES.AS, alg: "R U2' R' U' R U' R'", what: "Sune's mirror — the same move from the other corner" },
    { code: "ET", name: TRIGGER_NAMES.ET, alg: "F R U R' U' F'", what: "flips the last edges with the front face" },
    { code: "WT", name: TRIGGER_NAMES.WT, alg: "f R U R' U' f'", what: "the same flip with the two front layers" }
];

/** Where the booklet lives: the drills are its routes, cut into one question each. */
const GUIDE_URL = "https://rubik.csete.cc/";

/**
 * The home screen: what the app knows about this player, and the way into a run.
 *
 * An open run comes first, because it is the one thing waiting on the player.
 * Then — for a player with no history — the two cards that teach the game: how
 * a run works, and what the four triggers are. Then one card per mode, with the
 * rule it plays by, the accuracy this player has earned at it, and — once a
 * card is tapped — that mode's hint level, set and start, expanded inside the
 * card itself (ADR-0006).
 *
 * Which positions a mode draws, and what an answer is worth, is the core's
 * business; this screen only offers the choices and says what they mean.
 */
class Dashboard extends BElement {

    constructor() {
        super();
        // which card has its picker open: a screen concern, so it stays here
        this.openMode = null;
        // and whether the open run's skip is asking for confirmation
        this.confirmingSkip = false;
        this.confirmFor = null;
    }

    extractState({ run, players }) {
        const state = run ?? idleState();
        const name = (state.name ?? "").trim();
        // the confirm belongs to one open run: another run starts closed
        if (this.confirmFor !== state.startedAt) {
            this.confirmFor = state.startedAt;
            this.confirmingSkip = false;
        }
        const player = players?.[name];
        return {
            name,
            mode: state.mode,
            hintLevel: state.hintLevel,
            set: setOf(positions, state),
            phase: state.phase,
            index: state.index ?? 0,
            total: state.questions?.length ?? 0,
            answers: answersOf(state),
            startedAt: state.startedAt,
            player,
            // a player with answers has met the game; the teaching cards fold away
            newPlayer: !player?.runs?.length && Object.keys(player?.positions ?? {}).length === 0
        };
    }

    view() {
        return html`
            <article class="dashboard" data-testid="dashboard">
                ${this.heroView()}
                ${this.state.phase === "running" ? this.openRunView() : nothing}
                <section class="modes" aria-label="Modes">
                    ${MODE_CARDS.map(card => this.modeView(card))}
                </section>
                ${this.howView({ folded: !this.state.newPlayer })}
                ${this.triggersView({ folded: !this.state.newPlayer })}
            </article>
        `;
    }

    heroView() {
        return html`
            <section class="card hero" data-testid="hero">
                <p class="hero-eyebrow">OLL trigger recognition</p>
                <h2>read the position, name the trigger</h2>
                <p class="hero-sub">
                    57 positions, four triggers, one score per run. Pick a mode to
                    practise, and the stats page will tell you which positions
                    still cost you.
                </p>
                ${this.state.phase === "running"
                    ? nothing
                    : html`<p class="hero-empty" data-testid="no-open-run">
                        no open run — pick a mode below to start one.
                    </p>`}
                ${this.state.name === ""
                    ? html`<button type="button" class="hero-name" data-testid="hero-add-name"
                               @click=${() => askForName()}>
                        ${icon("user")} add your name so scores are recorded
                    </button>`
                    : nothing}
            </section>
        `;
    }

    /**
     * The open run: how far it got, how long it has been waiting, the one tap back
     * into it, and the way to throw it away. Past a week it has plainly been
     * abandoned, so skipping stands beside continue as a primary action.
     */
    openRunView() {
        const { mode, hintLevel, index, total, startedAt } = this.state;
        const stale = Number.isFinite(startedAt) && Date.now() - startedAt > STALE_AFTER_MS;
        return html`
            <section class="card open-run" data-testid="open-run">
                <p class="open-run-label">open run</p>
                <p class="open-run-title">${label(mode)} · ${label(hintLevel)}</p>
                <p class="open-run-facts">
                    <span data-testid="open-run-progress">${index + 1} / ${total}</span>
                    <span data-testid="open-run-started">started ${ago(startedAt)}</span>
                </p>
                <div class="open-run-actions">
                    <a class="continue" href="/run" data-testid="continue-run">
                        ${icon("forward")} continue
                    </a>
                    ${skipControl({
                        answers: this.state.answers,
                        confirming: this.confirmingSkip,
                        stale,
                        onAsk: () => this.askSkip(),
                        onConfirm: () => this.skip(),
                        onCancel: () => this.cancelSkip()
                    })}
                </div>
            </section>
        `;
    }

    askSkip() {
        this.confirmingSkip = true;
        this.triggerViewUpdate();
    }

    cancelSkip() {
        this.confirmingSkip = false;
        this.triggerViewUpdate();
    }

    /** Skips the open run: nothing is scored, and this card is simply gone. */
    skip() {
        this.confirmingSkip = false;
        skipRun();
    }

    /**
     * How the game works, in the player's own words: what is asked, what the
     * four triggers are, what a route is, what Training gives away, where the
     * points come from. Open on a first visit, folded away once there is
     * history — the detail stays one tap from every run.
     */
    howView({ folded = false } = {}) {
        return html`
            <details class="card study-card" data-testid="how-it-works" ?open=${!folded}>
                <summary>
                    <span class="study-icon">${icon("brain")}</span>
                    <span class="study-title">how the game works</span>
                    <span class="study-note">position → trigger</span>
                </summary>
                <div class="study-body">
                    <dl class="study-list">
                        <dt>Position</dt>
                        <dd>The top face plus the ring of side stickers: one of the 57 OLL
                            cases the booklet covers.</dd>
                        <dt>Trigger</dt>
                        <dd>One of four formulas — Sune (S), Anti-Sune (AS), Edge Trigger
                            (ET), Wide Edge Trigger (WT) — that each fix part of the last layer.</dd>
                        <dt>Step · route</dt>
                        <dd>A step applies one trigger. A route is one to three steps in
                            order, with an AUF turn (<code>U</code> <code>U'</code> <code>U2</code>)
                            lining up the next trigger between them.</dd>
                        <dt>Practice set</dt>
                        <dd><code>Grouped</code> drills one set at a time. A set is one booklet group,
                            or several neighbouring ones, never fewer than six positions —
                            two cases are a lookup, not a drill.</dd>
                        <dt>Training · Test</dt>
                        <dd><code>Training</code> shows the case name and OLL number while you answer;
                            <code>Test</code> shows only the diagram, so a right answer means recall.</dd>
                        <dt>Score</dt>
                        <dd>10 points per correct answer, times a streak multiplier that
                            climbs to 5; a miss resets it. Every answer is also recorded per
                            position, which is what the stats page's weak spots are made of.</dd>
                    </dl>
                    <p class="study-link">
                        The drills come from the booklet's routes: <a href="${GUIDE_URL}"
                        target="_blank" rel="noopener">the full guide at rubik.csete.cc</a>.
                    </p>
                </div>
            </details>
        `;
    }

    /**
     * The four triggers, spelled out: code, name, formula, and what it does.
     * Folded away like the study card, and open on a first visit.
     */
    triggersView({ folded = false } = {}) {
        return html`
            <details class="card study-card" data-testid="triggers" ?open=${!folded}>
                <summary>
                    <span class="study-icon study-icon--triggers">${icon("arrows-rotate")}</span>
                    <span class="study-title">the four triggers</span>
                    <span class="study-note">S · AS · ET · WT</span>
                </summary>
                <div class="study-body">
                    <p class="study-lede">Every one of the 57 positions solves with these,
                        in at most three applications. The buttons in a run are these four.</p>
                    <ul class="trigger-table">
                        ${TRIGGER_TABLE.map(({ code, name, alg, what }) => html`
                            <li class="trigger-row" data-testid="trigger-${code}">
                                <span class="trigger-code">${code}</span>
                                <span class="trigger-name">${name}</span>
                                <code class="trigger-alg">${alg}</code>
                                <span class="trigger-what">${what}</span>
                            </li>`)}
                    </ul>
                    <p class="study-link">
                        Recognition tips and every route, drawn out:
                        <a href="${GUIDE_URL}" target="_blank" rel="noopener">rubik.csete.cc</a>.
                    </p>
                </div>
            </details>
        `;
    }

    modeView(card) {
        // an open run owns the slice: it says what is being played, so no second
        // start is offered over it until it is finished or skipped (#14)
        const running = this.state.phase === "running";
        const open = !running && this.openMode === card.mode;
        return html`
            <article class="card step-card ${open ? "open" : ""}"
                     data-testid="mode-card-${card.mode}" data-mode="${card.mode}">
                ${this.modeHead(card, { open, running })}
                <p class="mode-rule" data-testid="mode-rule-${card.mode}">${card.rule}</p>
                ${open ? this.pickerView(card.mode) : nothing}
            </article>
        `;
    }

    /**
     * A card's face: its colour and glyph, its name, the rule it plays by, and
     * what this player has done at it so far. Tapping it opens the picker,
     * unless a run is already open.
     */
    modeHead({ mode, colour, glyph }, { open, running }) {
        const stats = modeStats(this.state.player?.runs).find(row => row.mode === mode);
        const played = (stats?.runs ?? 0) > 0;
        const face = html`
            <span class="step-badge mode-badge--${colour}">${icon(glyph)}</span>
            <span class="mode-title">
                <span class="mode-name">${label(mode)}</span>
                <span class="mode-meta">${label(defaultHintLevel(mode))}</span>
            </span>
            <span class="mode-record">
                ${played
                    ? html`<span class="check-badge" data-testid="finished-badge-${mode}"
                               title="a run of this mode is finished">${icon("check")}</span>`
                    : nothing}
                <span class="mode-accuracy ${played ? "" : "not-played"}"
                      data-testid="mode-accuracy-${mode}">${played ? percentage(stats.accuracy) : "not played"}</span>
            </span>
            ${running ? nothing : html`<span class="chevron" aria-hidden="true">${icon("chevron-down")}</span>`}
        `;
        return running
            ? html`<div class="mode-head" data-testid="mode-summary-${mode}">${face}</div>`
            : html`<button type="button" class="mode-head" data-testid="mode-toggle-${mode}"
                          aria-expanded="${open}" @click=${() => this.toggle(mode)}>${face}</button>`;
    }

    /** The picker, inside the card that was tapped: nothing to navigate to. */
    pickerView(mode) {
        const { name, hintLevel } = this.state;
        const chosen = this.state.set;
        const count = poolOf(positions, { mode, set: chosen?.id }).length;
        return html`
            <div class="picker">
                <fieldset class="field">
                    <legend>Hint level</legend>
                    <div class="choices">
                        ${HINT_LEVELS.map(level => html`
                            <button type="button" class="choice" data-testid="hint-${level}"
                                    aria-pressed="${level === hintLevel}"
                                    @click=${() => hintLevelChosen(level)}>${label(level)}</button>`)}
                    </div>
                </fieldset>
                ${this.setPicker(mode, chosen)}
                <p class="mode-line" data-testid="position-count">
                    ${label(mode)} · ${label(hintLevel)} · ${count} positions
                </p>
                <button type="button" class="start-button" data-testid="start-run"
                        ?disabled=${name === ""} @click=${() => this.start()}>
                    ${icon("play")} start the run
                </button>
            </div>
        `;
    }

    /**
     * The set a narrower mode draws from. `Grouped` offers practice sets, which
     * pair the booklet's small groups so every run has at least six positions;
     * `Route` offers a first-step lane per trigger, the cut the booklet's route
     * map makes. A mode that asks everything offers no set at all.
     */
    setPicker(mode, chosen) {
        const offered = setsOf(mode, positions);
        if (offered.length === 0) return nothing;
        return html`
            <label class="field">${mode === "grouped" ? "Practice set" : "First step"}
                <select data-testid="set-select" @change=${event => setChosen(event.target.value)}>
                    ${offered.map(option => html`
                        <option value="${option.id}" .selected=${option.id === chosen?.id}
                        >${option.label} · ${option.count}</option>`)}
                </select>
            </label>
            ${mode === "grouped"
                ? html`<p class="field-note">Neighbouring booklet groups are paired so
                    every set has at least six positions to rehearse.</p>`
                : nothing}
        `;
    }

    /**
     * One card at a time: tapping the open card closes it, tapping another makes
     * that one the mode for the next run — with the hint level the mode starts at
     * (its own, unless the player already chose one for it).
     */
    toggle(mode) {
        // the open run is the only run there is, until it is finished or skipped
        if (this.state.phase === "running") return;
        if (this.openMode === mode) {
            this.openMode = null;
        } else {
            if (this.state.mode !== mode) modeChosen(mode);
            this.openMode = mode;
        }
        this.triggerViewUpdate();
    }

    /** Starts the run the open card describes, and goes straight to it. */
    start() {
        if (!startRun(this.state.name)) return;
        navigation.navigate("/run");
    }
}

customElements.define('q-dashboard', Dashboard);
