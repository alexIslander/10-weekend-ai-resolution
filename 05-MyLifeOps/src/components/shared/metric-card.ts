import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('metric-card')
export class MetricCard extends LitElement {
  @property()
  label = '';

  @property()
  value: string | number = '';

  static styles = css`
    :host {
      display: block;
      background-color: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--r);
      padding: var(--sp-md);
      text-align: center;
    }

    .label {
      font-size: 0.9rem;
      color: var(--text);
      margin-bottom: var(--sp-sm);
    }

    .value {
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--text);
    }
  `;

  render() {
    return html`
      <div class="label">${this.label}</div>
      <div class="value">${this.value}</div>
    `;
  }
}