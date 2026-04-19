import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

import '../../components/orders-table'
import { resetStyles, themeStyles } from '../../styles/theme'

@customElement('orders-boundary')
export class OrdersBoundary extends LitElement {
  static styles = [
    themeStyles,
    resetStyles,
    css`
      :host {
        display: grid;
        gap: 24px;
      }

      .note {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-xl);
        padding: 24px;
      }

      h2 {
        font-size: 24px;
        letter-spacing: -0.03em;
      }

      p {
        margin-top: 10px;
        color: var(--fg-muted);
        line-height: 1.6;
      }
    `,
  ]

  @property({ type: String }) theme: 'light' | 'dark' = 'dark'

  render() {
    return html`
      <section class="note">
        <h2>Orders feature boundary</h2>
        <p>
          Keep transport, formatting, and mutation rules in a dedicated control when this page
          moves beyond demo data. The dashboard starter already has the table shell in place.
        </p>
      </section>
      <orders-table theme=${this.theme}></orders-table>
    `
  }
}
