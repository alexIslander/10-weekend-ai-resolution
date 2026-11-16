import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

import '../../components/activity-chart'
import { resetStyles, themeStyles } from '../../styles/theme'

@customElement('analytics-boundary')
export class AnalyticsBoundary extends LitElement {
  static styles = [
    themeStyles,
    resetStyles,
    css`
      :host {
        display: grid;
        gap: 24px;
      }

      .lead {
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
        color: var(--fg-muted);
        margin-top: 10px;
        line-height: 1.6;
      }
    `,
  ]

  @property({ type: String }) theme: 'light' | 'dark' = 'dark'

  render() {
    return html`
      <section class="lead">
        <h2>Analytics feature boundary</h2>
        <p>
          This page keeps the chart isolated so you can swap static data for API-driven reporting
          without disturbing the shell or customer feature.
        </p>
      </section>
      <activity-chart theme=${this.theme}></activity-chart>
    `
  }
}
