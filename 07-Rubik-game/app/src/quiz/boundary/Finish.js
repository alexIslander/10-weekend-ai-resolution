import BElement from "../../BElement.js";
import { html } from "lit-html";
import { resetRun } from "../control/RunControl.js";

const percent = (part, total) => (total === 0 ? 0 : Math.round((part / total) * 100));

/** Elapsed time as a player reads it, never as a countdown (ADR-0004). */
const duration = milliseconds => {
    const seconds = Math.max(0, Math.round(milliseconds / 1000));
    const minutes = Math.floor(seconds / 60);
    return minutes === 0 ? `${seconds} s` : `${minutes} min ${seconds % 60} s`;
};

/**
 * The finish screen: what the run was worth. Score, correct count, accuracy and
 * elapsed time — nothing else, and no board yet (that is a later ticket).
 */
class Finish extends BElement {

    extractState({ run }) {
        return run ?? {};
    }

    view() {
        const { score, correct, questions, startedAt, finishedAt } = this.state;
        const total = questions ? questions.length : 0;
        return html`
            <section class="finish" data-score="${score}" data-correct="${correct}" data-total="${total}">
                <h2>Run finished</h2>
                <dl class="result">
                    <dt>Score</dt><dd class="final-score">${score}</dd>
                    <dt>Correct</dt><dd>${correct} of ${total}</dd>
                    <dt>Accuracy</dt><dd>${percent(correct, total)}%</dd>
                    <dt>Elapsed</dt><dd>${duration((finishedAt ?? 0) - (startedAt ?? 0))}</dd>
                </dl>
                <button class="again" @click=${() => resetRun()}>start another run</button>
            </section>
        `;
    }
}

customElements.define('q-finish', Finish);
