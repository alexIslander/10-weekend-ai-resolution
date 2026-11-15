import BElement from "../../BElement.js";
import { html, nothing } from "lit-html";
import { groupChosen, hintLevelChosen, modeChosen, startRun } from "../control/RunControl.js";
import { defaultHintLevel, groupFor, HINT_LEVELS, poolOf } from "../core/run.mjs";
import { modeStats } from "../core/stats.mjs";
import { groups, positions } from "../entity/Positions.js";
import { idleState } from "../entity/RunReducer.js";
import { icon } from "../../icons.js";
import { ago, label, percentage } from "./format.js";

/**
 * The four modes that ship, each with the colour and glyph ADR-0006 reserves for
 * it. The two modes still to come keep their place in that reservation — their
 * cards appear when they do, so the grid never reshuffles under the player.
 */
const MODE_CARDS = [
    { mode: "random", colour: "yellow", glyph: "shuffle" },
    { mode: "grouped", colour: "blue", glyph: "layer-group" },
    { mode: "progressive", colour: "green", glyph: "arrow-trend-up" },
    { mode: "route", colour: "orange", glyph: "route" }
];

/**
 * The home screen: what the app knows about this player, and the way into a run.
 *
 * An open run comes first, because it is the one thing waiting on the player.
 * Then one card per mode: the rule it plays by, the accuracy this player has
 * earned at it over finished runs, and — once a card is tapped — that mode's
 * hint level, group and start, expanded inside the card itself (ADR-0006).
 *
 * Which positions a mode draws, and what an answer is worth, is the core's
 * business; this screen only offers the choices and says what they mean.
 */
class Dashboard extends BElement {

    constructor() {
        super();
        // which card has its picker open: a screen concern, so it stays here
        this.openMode = null;
    }

    extractState({ run, players }) {
        const state = run ?? idleState();
        const name = (state.name ?? "").trim();
        return {
            name,
            mode: state.mode,
            hintLevel: state.hintLevel,
            group: groupFor(groups, state),
            phase: state.phase,
            index: state.index ?? 0,
            total: state.questions?.length ?? 0,
            startedAt: state.startedAt,
            player: players?.[name]
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
            </section>
        `;
    }

    /** The open run, and the one tap back into it. */
    openRunView() {
        const { mode, hintLevel, index, total, startedAt } = this.state;
        return html`
            <section class="card open-run" data-testid="open-run">
                <p class="open-run-label">open run</p>
                <p class="open-run-title">${label(mode)} · ${label(hintLevel)}</p>
                <p class="open-run-facts">
                    <span data-testid="open-run-progress">${index + 1} / ${total}</span>
                    <span data-testid="open-run-started">started ${ago(startedAt)}</span>
                </p>
                <a class="continue" href="/run" data-testid="continue-run">
                    ${icon("forward")} continue
                </a>
            </section>
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
                ${open ? this.pickerView(card.mode) : nothing}
            </article>
        `;
    }

    /**
     * A card's face: its colour and glyph, its name, the hint level it starts at,
     * and what this player has done at it so far. Tapping it opens the picker,
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
        const { name, hintLevel, group } = this.state;
        const count = poolOf(positions, { mode, group }).length;
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
                ${mode === "grouped" ? this.groupPicker() : nothing}
                <p class="mode-line" data-testid="position-count">
                    ${label(mode)}${mode === "grouped" ? ` · ${group}` : ""} · ${label(hintLevel)} · ${count} positions
                </p>
                <button type="button" class="start-button" data-testid="start-run"
                        ?disabled=${name === ""} @click=${() => this.start()}>
                    ${icon("play")} start the run
                </button>
            </div>
        `;
    }

    /** Grouped asks which of the 14 groups; every other mode asks everything. */
    groupPicker() {
        const { group } = this.state;
        return html`
            <label class="field">Group
                <select data-testid="group-select" @change=${event => groupChosen(event.target.value)}>
                    ${groups.map(name => html`
                        <option value="${name}" .selected=${name === group}>${name}</option>`)}
                </select>
            </label>
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
