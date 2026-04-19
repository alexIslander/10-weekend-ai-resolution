import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

import '../../components/activity-chart'
import '../../components/kpi-cards'
import '../../components/orders-table'
import { resetStyles, themeStyles } from '../../styles/theme'

@customElement('dashboard-boundary')
export class DashboardBoundary extends LitElement {
  static styles = [
    themeStyles,
    resetStyles,
    css`
      :host {
        display: block;
      }

      .grid {
        display: grid;
        gap: 24px;
        margin-top: 24px;
      }

      .highlights {
        display: grid;
        grid-template-columns: minmax(0, 1.6fr) minmax(280px, 1fr);
        gap: 24px;
        margin-top: 24px;
      }

      .panel {
        background: linear-gradient(135deg, var(--bg-card), color-mix(in srgb, var(--accent) 8%, var(--bg-card)));
        border: 1px solid var(--border);
        border-radius: var(--radius-xl);
        padding: 24px;
        box-shadow: var(--shadow);
      }

      .eyebrow {
        color: var(--accent);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      h2 {
        font-size: 28px;
        letter-spacing: -0.04em;
        margin-top: 10px;
      }

      p {
        color: var(--fg-muted);
        margin-top: 10px;
        max-width: 56ch;
        line-height: 1.6;
      }

      .stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        margin-top: 18px;
      }

      .stat {
        background: var(--bg);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: 14px 16px;
      }

      .stat-value {
        font-size: 20px;
        font-weight: 700;
        letter-spacing: -0.03em;
      }

      .stat-label {
        color: var(--fg-muted);
        font-size: 12px;
        margin-top: 4px;
      }

      .checklist {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-xl);
        padding: 24px;
      }

      .checklist h3 {
        font-size: 16px;
        letter-spacing: -0.02em;
      }

      .checklist ul {
        list-style: none;
        display: grid;
        gap: 12px;
        margin-top: 16px;
      }

      .checklist li {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        color: var(--fg-muted);
        line-height: 1.5;
      }

      .bullet {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: var(--accent);
        margin-top: 6px;
        flex: 0 0 auto;
      }

      @media (max-width: 900px) {
        .highlights {
          grid-template-columns: 1fr;
        }

        .stats {
          grid-template-columns: 1fr;
        }
      }
    `,
  ]

  @property({ type: String }) theme: 'light' | 'dark' = 'dark'

  render() {
    return html`
      <section class="panel">
        <div class="eyebrow">Starter baseline</div>
        <h2>Lit admin shell with feature boundaries</h2>
        <p>
          Use this dashboard page as the shell health check. It keeps the visual system alive
          while new features can be added under isolated boundary, control, and entity modules.
        </p>
        <div class="stats">
          <div class="stat">
            <div class="stat-value">5</div>
            <div class="stat-label">Primary navigation areas</div>
          </div>
          <div class="stat">
            <div class="stat-value">1</div>
            <div class="stat-label">CRUD feature scaffolded</div>
          </div>
          <div class="stat">
            <div class="stat-value">0</div>
            <div class="stat-label">Framework runtime adapters</div>
          </div>
        </div>
      </section>

      <div class="grid">
        <kpi-cards theme=${this.theme}></kpi-cards>
      </div>

      <div class="highlights">
        <activity-chart theme=${this.theme}></activity-chart>
        <aside class="checklist">
          <h3>What to build next</h3>
          <ul>
            <li><span class="bullet"></span><span>Replace in-memory controls with an API client per feature.</span></li>
            <li><span class="bullet"></span><span>Add route state so pages can deep-link instead of switching locally.</span></li>
            <li><span class="bullet"></span><span>Promote repeated cards, tables, and forms into shared UI primitives only after reuse is proven.</span></li>
          </ul>
        </aside>
      </div>

      <div class="grid">
        <orders-table theme=${this.theme}></orders-table>
      </div>
    `
  }
}
