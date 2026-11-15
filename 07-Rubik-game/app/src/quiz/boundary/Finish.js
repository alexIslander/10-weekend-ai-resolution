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
            <section class="finish" data-score="${score}" data-correct="${correct}" data-total="${total}">
                <h2>Run finished</h2>
                <dl class="result">
                    <dt>Score</dt><dd class="final-score">${score}</dd>
                    <dt>Correct</dt><dd>${correct} of ${total}</dd>
                    <dt>Accuracy</dt><dd>${accuracy(correct, total)}%</dd>
                    <dt>Elapsed</dt><dd>${duration(elapsedOf(this.state))}</dd>
                </dl>
                ${isBoardMode(mode)
                    ? html`<a class="board-link" href="/scores#${boardId({ mode, hintLevel })}">see the board</a>`
                    : nothing}
                <button class="again" data-testid="start-another" @click=${() => this.again()}>
                    start another run
                </button>
            </section>
        `;
    }
}

customElements.define('q-finish', Finish);
