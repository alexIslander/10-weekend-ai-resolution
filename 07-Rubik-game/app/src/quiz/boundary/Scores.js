import BElement from "../../BElement.js";
import { html } from "lit-html";
import { boardId, boardsOf } from "../core/boards.mjs";
import { date, duration, label } from "./format.js";

/**
 * The scores page: one section per mode, with a column per hint level — the
 * presentation ADR-0004 asks for, so a Training score is never read as a Test
 * one. Every board is derived from finished runs; nothing here ranks or filters.
 *
 * Each mode is a `.card` (ADR-0006). Each board is anchored as
 * `#board-<mode>-<hint level>`, so the finish screen can point straight at the
 * board of the run that just ended.
 */
class Scores extends BElement {

    extractState({ players }) {
        return players ?? {};
    }

    view() {
        return html`
            <article class="scores" data-testid="scores-page">
                <h2>Scores</h2>
                <p class="scores-intro">Best score first; the faster run wins a tie.</p>
                ${boardsOf(this.state).map(({ mode, boards }) => this.modeView(mode, boards))}
            </article>
        `;
    }

    modeView(mode, boards) {
        return html`
            <section class="card mode" data-testid="scores-mode-${mode}">
                <h3>${label(mode)}</h3>
                <div class="mode-boards">
                    ${boards.map(({ hintLevel, rows }) => this.boardView(mode, hintLevel, rows))}
                </div>
            </section>
        `;
    }

    boardView(mode, hintLevel, rows) {
        return html`
            <section class="board" id="${boardId({ mode, hintLevel })}"
                     data-testid="board-${mode}-${hintLevel}">
                <h4>${label(hintLevel)}</h4>
                ${rows.length === 0
                    ? html`<p class="empty" data-testid="board-empty">no finished runs yet</p>`
                    : html`
                        <ol class="board-rows">
                            ${rows.map((row, index) => html`
                                <li class="board-row" data-testid="board-row"
                                    data-name="${row.name}" data-score="${row.score}">
                                    <span class="rank" aria-hidden="true">${index + 1}</span>
                                    <span class="board-row-name" data-testid="board-row-name">${row.name}</span>
                                    <span class="board-row-score" data-testid="board-row-score">${row.score}</span>
                                    <span class="board-row-meta">
                                        <span class="board-row-date" data-testid="board-row-date">${date(row.at)}</span>
                                        <span class="board-row-elapsed" data-testid="board-row-elapsed">${duration(row.elapsed)}</span>
                                    </span>
                                </li>`)}
                        </ol>`}
            </section>
        `;
    }
}

customElements.define('q-scores', Scores);
