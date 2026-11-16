import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('progress-ring')
export class ProgressRing extends LitElement {
  @property({ type: Number })
  value = 0;

  @property({ type: Number })
  max = 100;

  static styles = css`
    :host {
      display: inline-block;
      width: 100px;
      height: 100px;
    }

    svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    circle {
      fill: none;
      stroke-width: 8;
      stroke-linecap: round;
    }

    .background {
      stroke: var(--surface);
    }

    .progress {
      stroke: var(--text);
      stroke-dasharray: calc(2 * 3.141592653589793 * 40);
      stroke-dashoffset: calc(2 * 3.141592653589793 * 40 * (1 - var(--progress-percentage) / 100));
      transition: stroke-dashoffset 0.3s ease;
    }
  `;

  render() {
    const progressPercentage = (this.value / this.max) * 100;
    
    return html`
      <svg viewBox="0 0 100 100">
        <circle 
          class="background" 
          cx="50" 
          cy="50" 
          r="40" 
        />
        <circle 
          class="progress" 
          cx="50" 
          cy="50" 
          r="40" 
          style="--progress-percentage: ${progressPercentage}"
        />
      </svg>
    `;
  }
}