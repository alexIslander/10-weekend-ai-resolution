import BElement from "../../BElement.js";
import { html } from "lit-html";
import { boardsOf } from "../core/boards.mjs";

/** `test` -> `Test`, `progressive` -> `Progressive`: one rule for every mode and level. */
const label = value => (value ? value.charAt(0).toUpperCase() + value.slice(1) : "");

/** A finish date as the player reads it: local, stable, sortable. */
const date = milliseconds => {
    const finished = new Date(milliseconds);
    const pad = value => String(value).padStart(2, "0");
    return `${finished.getFullYear()}-${pad(finished.getMonth() + 1)}-${pad(finished.getDate())}`;
};

/**
 * The scores page: every board the game offers, derived from finished runs.
 * Nothing here ranks or filters — core/boards.mjs decides, this view shows.
 *
 * Each board is anchored as `#board-<mode>-<hint level>`, so the finish screen
 * can point straight at the board of the run that just ended.
 */
class Scores extends BElement {

    extractState({ players }) {
        return players ?? {};
    }

    view() {
        return html`
            <article class="scores">
                <h2>Scores</h2>
                <p class="scores-intro">Best score first; the faster run wins a tie.</p>
                ${boardsOf(this.state).map(({ mode, boards }) =>
                    boards.map(({ hintLevel, rows }) => this.boardView(mode, hintLevel, rows)))}
            </article>
        `;
    }

    boardView(mode, hintLevel, rows) {
        return html`
            <section class="board" id="board-${mode}-${hintLevel}"
                     data-mode="${mode}" data-hint-level="${hintLevel}">
                <h3>${label(mode)} · ${label(hintLevel)}</h3>
                ${rows.length === 0
                    ? html`<p class="empty">no finished runs yet</p>`
                    : html`
                        <table class="board-table">
                            <thead>
                                <tr>
                                    <th scope="col">#</th>
                                    <th scope="col">player</th>
                                    <th scope="col">score</th>
                                    <th scope="col">date</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows.map((row, index) => html`
                                    <tr class="board-row" data-name="${row.name}" data-score="${row.score}">
                                        <td class="rank">${index + 1}</td>
                                        <td class="name">${row.name}</td>
                                        <td class="score">${row.score}</td>
                                        <td class="date">${date(row.at)}</td>
                                    </tr>`)}
                            </tbody>
                        </table>`}
            </section>
        `;
    }
}

customElements.define('q-scores', Scores);
