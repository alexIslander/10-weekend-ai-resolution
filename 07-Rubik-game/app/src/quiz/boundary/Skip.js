import { html } from "lit-html";
import { icon } from "../../icons.js";

/**
 * What a Skip costs, counted from the answers the run has taken. A Skip is not
 * a quiet undo, so the confirm says the number out loud (ADR-0005).
 * @param {number} answers
 */
export const skipConsequence = (answers) => answers === 0
    ? "Nothing has been answered yet, so nothing is scored — the run simply goes away."
    : `The ${answers === 1 ? "1 answer" : `${answers} answers`} this run collected come back out of your records, and nothing about it is scored.`;

/**
 * Skip, and the inline confirm that names what it costs: one control, because
 * the run screen's status bar and the dashboard's open-run card offer the same
 * thing and must say the same words.
 *
 * `stale` is the older open run (docs/tickets.md #14): past a week, skipping is
 * offered as a primary action beside continue rather than as a quiet aside.
 * @param {{answers: number, confirming: boolean, stale?: boolean, onAsk: () => void, onConfirm: () => void, onCancel: () => void}} options
 */
export const skipControl = ({ answers, confirming, stale = false, onAsk, onConfirm, onCancel }) => confirming
    ? html`
        <div class="skip-confirm" role="alertdialog" aria-label="Skip this open run">
            <p><strong>Skip this open run?</strong> ${skipConsequence(answers)}</p>
            <div class="skip-actions">
                <button type="button" class="danger" data-testid="confirm-skip" @click=${onConfirm}>
                    ${icon("xmark")} skip it
                </button>
                <button type="button" data-testid="cancel-skip" @click=${onCancel}>keep playing</button>
            </div>
        </div>`
    : html`
        <button type="button" class="skip ${stale ? "is-stale" : ""}" data-testid="skip-run"
                @click=${onAsk}>
            ${icon("xmark")} skip the run
        </button>`;
