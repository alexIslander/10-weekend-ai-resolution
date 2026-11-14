import BElement from "../../BElement.js";
import { html } from "lit-html";
import { resetRun } from "../control/RunControl.js";
import { accuracy } from "../core/run.mjs";

/** Elapsed time as a player reads it, never as a countdown (ADR-0004). */
const duration = milliseconds => {
    const seconds = Math.max(0, Math.round(milliseconds / 1000));
    const minutes = Math.floor(seconds / 60);
    return minutes === 0 ? `${seconds} s` : `${minutes} min ${seconds % 60} s`;
};

/**
 * The finish screen: what the run was worth — score, correct count, accuracy and
 * elapsed time — and the way to the board this run just landed on.
 */
class Finish extends BElement {

    extractState({ run }) {
        return run ?? {};
    }

    view() {
        const { score, correct, questions, startedAt, finishedAt, mode, hintLevel } = this.state;
        const total = questions ? questions.length : 0;
        return html`
            <section class="finish" data-score="${score}" data-correct="${correct}" data-total="${total}">
                <h2>Run finished</h2>
                <dl class="result">
                    <dt>Score</dt><dd class="final-score">${score}</dd>
                    <dt>Correct</dt><dd>${correct} of ${total}</dd>
                    <dt>Accuracy</dt><dd>${accuracy(correct, total)}%</dd>
                    <dt>Elapsed</dt><dd>${duration((finishedAt ?? 0) - (startedAt ?? 0))}</dd>
                </dl>
                <a class="board-link" href="/scores#board-${mode}-${hintLevel}">see the board</a>
                <button class="again" @click=${() => resetRun()}>start another run</button>
            </section>
        `;
    }
}

customElements.define('q-finish', Finish);
