import BElement from "../../BElement.js";
import { html } from "lit-html";
import { resetRun } from "../control/RunControl.js";
import { boardId } from "../core/boards.mjs";
import { accuracy, elapsedOf } from "../core/run.mjs";
import { duration } from "./format.js";

/**
 * The finish screen: what the run was worth — score, correct count, accuracy and
 * elapsed time — and the way to the board this run just landed on.
 */
class Finish extends BElement {

    extractState({ run }) {
        return run ?? {};
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
                <a class="board-link" href="/scores#${boardId({ mode, hintLevel })}">see the board</a>
                <button class="again" @click=${() => resetRun()}>start another run</button>
            </section>
        `;
    }
}

customElements.define('q-finish', Finish);
