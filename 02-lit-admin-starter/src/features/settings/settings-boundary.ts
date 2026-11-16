import { LitElement, css, html } from 'lit'
import { customElement } from 'lit/decorators.js'

import { resetStyles, themeStyles } from '../../styles/theme'

@customElement('settings-boundary')
export class SettingsBoundary extends LitElement {
  static styles = [
    themeStyles,
    resetStyles,
    css`
      :host {
        display: grid;
        gap: 24px;
      }

      .layout {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 24px;
      }

      .card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-xl);
        padding: 24px;
      }

      h2 {
        font-size: 24px;
        letter-spacing: -0.03em;
      }

      h3 {
        font-size: 16px;
        letter-spacing: -0.02em;
      }

      p {
        color: var(--fg-muted);
        margin-top: 10px;
        line-height: 1.6;
      }

      ul {
        margin-top: 16px;
        padding-left: 18px;
        color: var(--fg-muted);
        line-height: 1.7;
      }

      @media (max-width: 900px) {
        .layout {
          grid-template-columns: 1fr;
        }
      }
    `,
  ]

  render() {
    return html`
      <section class="card">
        <h2>Starter settings</h2>
        <p>
          Reserve this space for environment-backed settings, role policies, and integration
          toggles. The starter keeps settings intentionally simple so you can map them to your
          own backend model.
        </p>
      </section>

      <section class="layout">
        <article class="card">
          <h3>Recommended next modules</h3>
          <ul>
            <li>workspace members and roles</li>
            <li>notification channels</li>
            <li>billing plan guardrails</li>
          </ul>
        </article>
        <article class="card">
          <h3>Implementation note</h3>
          <p>
            Keep persistence and validation outside the visual boundary. The same layout can then
            host local mocks in development and real service controls in production.
          </p>
        </article>
      </section>
    `
  }
}
