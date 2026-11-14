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
 */
class Stats extends BElement {

    extractState({ players, run }) {
        const name = (run?.name ?? "").trim();
        return { name, player: players?.[name] };
    }

    view() {
        const { name, player } = this.state;
        return html`
            <article class="stats" data-name="${name}">
                <h2>Stats</h2>
                ${hasHistory(player) ? this.historyView(player) : this.emptyView(name)}
                ${player ? this.dangerView(player.name) : nothing}
            </article>
        `;
    }

    emptyView(name) {
        return html`
            <p class="empty">${name ? "no answers yet —" : "no player yet —"}
                <a href="/">${name ? "start a run" : "type a name on the play screen"}</a>
            </p>
        `;
    }

    historyView(player) {
        return html`
            <p class="stats-player">${player.name}</p>
            ${player.runs.length === 0
                ? html`<p class="empty">no finished runs yet — the answers below come from runs that did not finish</p>`
                : nothing}
            ${this.totalsView(player)}
            ${this.modesView(player)}
            ${this.groupsView(player)}
            ${this.weakView(player)}
        `;
    }

    /** Lifetime totals: runs finished, answers given, and how many of those were right. */
    totalsView(player) {
        const { runs, answered, accuracy } = totals(player.positions, player.runs);
        return html`
            <dl class="totals">
                <dt>Runs</dt><dd class="total-runs">${runs}</dd>
                <dt>Answers given</dt><dd class="total-answered">${answered}</dd>
                <dt>Accuracy</dt><dd class="total-accuracy">${percentage(accuracy)}</dd>
            </dl>
        `;
    }

    modesView(player) {
        return html`
            <section class="stat-section">
                <h3>By mode</h3>
                <table class="stat-table">
                    <thead>
                        <tr>
                            <th scope="col">Mode</th>
                            <th scope="col">Runs</th>
                            <th scope="col">Accuracy</th>
                            <th scope="col">Best</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${modeStats(player.runs).map(row => html`
                            <tr data-mode="${row.mode}">
                                <th scope="row">${label(row.mode)}</th>
                                <td>${row.runs}</td>
                                <td>${percentage(row.accuracy)}</td>
                                <td>${row.best}</td>
                            </tr>`)}
                    </tbody>
                </table>
            </section>
        `;
    }

    /** All 14 groups in booklet order: a group never played reads zero, not blank. */
    groupsView(player) {
        return html`
            <section class="stat-section">
                <h3>By group</h3>
                <table class="stat-table">
                    <thead>
                        <tr>
                            <th scope="col">Group</th>
                            <th scope="col">Attempts</th>
                            <th scope="col">Accuracy</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${groupStats(positions, player.positions).map(row => html`
                            <tr data-group="${row.group}">
                                <th scope="row">${row.group}</th>
                                <td>${row.attempts}</td>
                                <td>${percentage(row.accuracy)}</td>
                            </tr>`)}
                    </tbody>
                </table>
            </section>
        `;
    }

    /** The ten weakest positions, as the core ranks them: lowest accuracy first. */
    weakView(player) {
        const rows = worstPositions(positions, player.positions);
        return html`
            <section class="stat-section">
                <h3>Weak spots</h3>
                ${rows.length === 0
                    ? html`<p class="empty">no position answered yet</p>`
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
            <li class="weak-row" data-oll="${oll}" data-accuracy="${accuracy}">
                <a class="drill" href="/" @click=${event => { if (!startDrill(oll)) event.preventDefault(); }}>
                    <span class="weak-name">${name}</span>
                    <span class="weak-accuracy">${percentage(accuracy)}</span>
                    <span class="weak-detail">
                        <span class="weak-oll">OLL ${oll}</span>
                        <span class="weak-group">${group}</span>
                        <span class="weak-attempts">${attempts} ${attempts === 1 ? "attempt" : "attempts"}</span>
                    </span>
                    <span class="weak-seen">last seen ${date(lastSeenAt)}</span>
                </a>
            </li>
        `;
    }

    dangerView(name) {
        return html`
            <div class="danger-zone">
                <button type="button" class="danger" @click=${() => resetStats(name)}>reset stats</button>
                <button type="button" class="danger" @click=${() => deletePlayer(name)}>delete player</button>
            </div>
        `;
    }
}

customElements.define('q-stats', Stats);
