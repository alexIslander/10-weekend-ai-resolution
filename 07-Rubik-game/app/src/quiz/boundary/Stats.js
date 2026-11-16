import BElement from "../../BElement.js";
import { html, nothing } from "lit-html";
import { deletePlayer, resetStats } from "../control/PlayersControl.js";
import { startDrill } from "../control/RunControl.js";
import { groupStats, hasHistory, modeStats, totals, worstPositions } from "../core/stats.mjs";
import { positions } from "../entity/Positions.js";
import { date, label, percentage } from "./format.js";

/**
 * The stats page: what the player's answers add up to. Accuracy per mode, the
 * rollup over the 14 groups, the positions worth practising next, and the
 * lifetime totals — all read from the records the run screen writes, never
 * stored a second time.
 *
 * The player is the name the run slice remembers: whoever the next run would be
 * recorded under. A weak spot opens a one-question drill on that position; the
 * two destructive buttons are the only way out of a history.
 *
 * Every block is a `.card` (ADR-0006) and the figures are rows in one grid with
 * a head row of labels, not a table: nothing scrolls sideways at 390 px.
 */
class Stats extends BElement {

    extractState({ players, run }) {
        const name = (run?.name ?? "").trim();
        return { name, player: players?.[name] };
    }

    view() {
        const { name, player } = this.state;
        return html`
            <article class="stats" data-testid="stats-page" data-name="${name}">
                <h2>Stats</h2>
                ${hasHistory(player) ? this.historyView(player) : this.emptyView(name)}
                ${player ? this.dangerView(player.name) : nothing}
            </article>
        `;
    }

    emptyView(name) {
        return html`
            <p class="card empty" data-testid="stats-empty">${name ? "no answers yet —" : "no player yet —"}
                <a href="/">${name ? "start a run" : "type a name on the play screen"}</a>
            </p>
        `;
    }

    historyView(player) {
        return html`
            <section class="card stats-summary">
                <p class="stats-player" data-testid="stats-player">${player.name}</p>
                ${this.totalsView(player)}
            </section>
            ${player.runs.length === 0
                ? html`<p class="card empty" data-testid="no-runs">
                    no finished runs yet — the answers below come from runs that did not finish
                </p>`
                : nothing}
            ${this.modesView(player)}
            ${this.groupsView(player)}
            ${this.weakView(player)}
        `;
    }

    /** Lifetime totals: runs finished, answers given, and how many of those were right. */
    totalsView(player) {
        const { runs, answered, accuracy } = totals(player.positions, player.runs);
        return html`
            <dl class="totals" data-testid="totals">
                <dt>Runs</dt><dd data-testid="total-runs">${runs}</dd>
                <dt>Answers given</dt><dd data-testid="total-answered">${answered}</dd>
                <dt>Accuracy</dt><dd data-testid="total-accuracy">${percentage(accuracy)}</dd>
            </dl>
        `;
    }

    modesView(player) {
        return html`
            <section class="card stat-section" data-testid="modes">
                <h3>By mode</h3>
                <div class="stat-heading" aria-hidden="true">
                    <span>Mode</span><span>Runs</span><span>Accuracy</span><span>Best</span>
                </div>
                ${modeStats(player.runs).map(row => html`
                    <div class="stat-row" data-testid="mode-row-${row.mode}">
                        <span class="stat-name" data-testid="stat-name">${label(row.mode)}</span>
                        <span data-testid="mode-${row.mode}-runs">${row.runs}</span>
                        <span data-testid="mode-${row.mode}-accuracy">${percentage(row.accuracy)}</span>
                        <span data-testid="mode-${row.mode}-best">${row.best}</span>
                    </div>`)}
            </section>
        `;
    }

    /** All 14 groups in booklet order: a group never played reads zero, not blank. */
    groupsView(player) {
        return html`
            <section class="card stat-section" data-testid="groups">
                <h3>By group</h3>
                <div class="stat-heading stat-heading--group" aria-hidden="true">
                    <span>Group</span><span>Attempts</span><span>Accuracy</span>
                </div>
                ${groupStats(positions, player.positions).map(row => html`
                    <div class="stat-row stat-row--group" data-testid="group-row-${row.group}">
                        <span class="stat-name" data-testid="stat-name">${row.group}</span>
                        <span data-testid="group-${row.group}-attempts">${row.attempts}</span>
                        <span data-testid="group-${row.group}-accuracy">${percentage(row.accuracy)}</span>
                    </div>`)}
            </section>
        `;
    }

    /** The ten weakest positions, as the core ranks them: lowest accuracy first. */
    weakView(player) {
        const rows = worstPositions(positions, player.positions);
        return html`
            <section class="card stat-section" data-testid="weak-spots">
                <h3>Weak spots</h3>
                ${rows.length === 0
                    ? html`<p class="empty" data-testid="no-weak-spots">no position answered yet</p>`
                    : html`
                        <p class="stat-note">Lowest accuracy first; tap a row to drill that position.</p>
                        <ul class="weak-spots">
                            ${rows.map(row => this.weakRow(row))}
                        </ul>`}
            </section>
        `;
    }

    /** One weak spot, and the drill it starts: one question on exactly this position. */
    weakRow({ oll, name, group, attempts, accuracy, lastSeenAt }) {
        return html`
            <li class="weak-row" data-testid="weak-row-${oll}" data-oll="${oll}"
                data-accuracy="${accuracy}">
                <a class="drill" data-testid="drill-${oll}" href="/run"
                   @click=${event => { if (!startDrill(oll)) event.preventDefault(); }}>
                    <span class="weak-name">${name}</span>
                    <span class="weak-accuracy">${percentage(accuracy)}</span>
                    <span class="weak-detail">
                        <span>OLL ${oll}</span>
                        <span>${group}</span>
                        <span>${attempts} ${attempts === 1 ? "attempt" : "attempts"}</span>
                    </span>
                    <span class="weak-seen">last seen ${date(lastSeenAt)}</span>
                </a>
            </li>
        `;
    }

    dangerView(name) {
        return html`
            <section class="card danger-zone" data-testid="danger-zone">
                <h3>Start over</h3>
                <p class="stat-note">Reset clears the records and the finished runs and keeps the name.
                    Delete removes the player everywhere.</p>
                <div class="danger-actions">
                    <button type="button" class="danger" data-testid="reset-stats"
                            @click=${() => resetStats(name)}>reset stats</button>
                    <button type="button" class="danger" data-testid="delete-player"
                            @click=${() => deletePlayer(name)}>delete player</button>
                </div>
            </section>
        `;
    }
}

customElements.define('q-stats', Stats);
