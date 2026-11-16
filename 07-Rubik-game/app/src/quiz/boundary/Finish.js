import BElement from "../../BElement.js";
import { html, nothing } from "lit-html";
import { resetRun } from "../control/RunControl.js";
import { boardId } from "../core/boards.mjs";
import { accuracy, elapsedOf, isBoardMode } from "../core/run.mjs";
import { duration } from "./format.js";

/**
 * The finish screen: what the run was worth — score, correct count, accuracy and
 * elapsed time — and the way to the board this run just landed on. A drill
 * lands on no board, so its finish screen offers the result only.
 */
class Finish extends BElement {

    extractState({ run }) {
        return run ?? {};
    }

    /** Back to the dashboard: the run is over, and the picker lives there now. */
    again() {
        resetRun();
        navigation.navigate("/");
    }

    view() {
        const { score, correct, questions, mode, hintLevel } = this.state;
        const total = questions ? questions.length : 0;
        return html`
            <section class="card finish" data-testid="finish" data-score="${score}"
                     data-correct="${correct}" data-total="${total}">
                <h2>Run finished</h2>
                <p class="score-line">
                    <span class="score-number" data-testid="final-score">${score}</span>
                    <span class="score-caption">points</span>
                </p>
                <dl class="result">
                    <dt>Correct</dt>
                    <dd><span data-testid="finish-correct">${correct}</span> of
                        <span data-testid="finish-total">${total}</span></dd>
                    <dt>Accuracy</dt><dd data-testid="finish-accuracy">${accuracy(correct, total)}%</dd>
                    <dt>Elapsed</dt><dd data-testid="finish-elapsed">${duration(elapsedOf(this.state))}</dd>
                </dl>
                ${isBoardMode(mode)
                    ? html`<a class="board-link" data-testid="board-link"
                             href="/scores#${boardId({ mode, hintLevel })}">see the board</a>`
                    : nothing}
                <button class="again" data-testid="start-another" @click=${() => this.again()}>
                    start another run
                </button>
            </section>
        `;
    }
}

customElements.define('q-finish', Finish);
