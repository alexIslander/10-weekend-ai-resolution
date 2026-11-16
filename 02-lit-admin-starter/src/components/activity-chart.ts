import { LitElement, html, css } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { themeStyles, resetStyles } from '../styles/theme'

interface DataPoint {
  label: string
  revenue: number
  orders: number
}

const monthlyData: DataPoint[] = [
  { label: 'Sep', revenue: 28400, orders: 310 },
  { label: 'Oct', revenue: 32100, orders: 380 },
  { label: 'Nov', revenue: 29800, orders: 350 },
  { label: 'Dec', revenue: 41200, orders: 520 },
  { label: 'Jan', revenue: 38600, orders: 470 },
  { label: 'Feb', revenue: 48350, orders: 560 },
]

@customElement('activity-chart')
export class ActivityChart extends LitElement {
  static styles = [
    themeStyles,
    resetStyles,
    css`
      .container {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: 24px;
      }
      .chart-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24px;
      }
      .chart-title {
        font-size: 16px;
        font-weight: 600;
        letter-spacing: -0.02em;
      }
      .chart-subtitle {
        font-size: 13px;
        color: var(--fg-muted);
        margin-top: 2px;
      }
      .legend {
        display: flex;
        gap: 16px;
      }
      .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--fg-muted);
        font-weight: 500;
      }
      .legend-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }
      .chart-area {
        position: relative;
        height: 220px;
        margin-top: 8px;
      }
      svg {
        width: 100%;
        height: 100%;
        overflow: visible;
      }
      .grid-line {
        stroke: var(--border-subtle);
        stroke-width: 1;
        stroke-dasharray: 4 4;
      }
      .y-label {
        font-size: 11px;
        fill: var(--fg-subtle);
        font-family: var(--font-mono);
      }
      .x-label {
        font-size: 12px;
        fill: var(--fg-muted);
        text-anchor: middle;
        font-family: var(--font-sans);
      }
      .area-revenue {
        fill: var(--accent-subtle);
        opacity: 0.5;
      }
      .line-revenue {
        fill: none;
        stroke: var(--accent);
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .area-orders {
        fill: var(--info-bg);
        opacity: 0.4;
      }
      .line-orders {
        fill: none;
        stroke: var(--info);
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .data-point {
        transition: r 150ms ease;
      }
      .data-point:hover {
        r: 5;
      }
      .tooltip-group {
        pointer-events: none;
      }
      .tooltip-bg {
        fill: var(--bg-card);
        stroke: var(--border);
        stroke-width: 1;
        rx: 6;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
      }
      .tooltip-text {
        font-size: 11px;
        font-family: var(--font-sans);
        fill: var(--fg);
        font-weight: 500;
      }
      .tooltip-sub {
        font-size: 10px;
        font-family: var(--font-sans);
        fill: var(--fg-muted);
      }
    `,
  ]

  @state() private _hoveredIndex: number | null = null

  private _padL = 54
  private _padR = 16
  private _padT = 12
  private _padB = 36
  private _w = 600
  private _h = 220

  private get _maxRevenue() {
    return Math.max(...monthlyData.map((d) => d.revenue)) * 1.15
  }

  private _x(i: number) {
    const usable = this._w - this._padL - this._padR
    return this._padL + (i / (monthlyData.length - 1)) * usable
  }

  private _yRev(val: number) {
    const usable = this._h - this._padT - this._padB
    return this._padT + (1 - val / this._maxRevenue) * usable
  }

  private _yOrd(val: number) {
    const maxOrd = Math.max(...monthlyData.map((d) => d.orders)) * 1.15
    const usable = this._h - this._padT - this._padB
    return this._padT + (1 - val / maxOrd) * usable
  }

  private _polyline(accessor: (d: DataPoint) => number, yFn: (v: number) => number) {
    return monthlyData.map((d, i) => `${this._x(i)},${yFn(accessor(d))}`).join(' ')
  }

  private _areaPath(accessor: (d: DataPoint) => number, yFn: (v: number) => number) {
    const bottom = this._h - this._padB
    const points = monthlyData.map((d, i) => `${this._x(i)},${yFn(accessor(d))}`)
    return `M${this._x(0)},${bottom} L${points.join(' L')} L${this._x(monthlyData.length - 1)},${bottom} Z`
  }

  render() {
    const gridLevels = [0, 0.25, 0.5, 0.75, 1]
    const bottom = this._h - this._padB

    return html`
      <div class="container">
        <div class="chart-header">
          <div>
            <div class="chart-title">Revenue Overview</div>
            <div class="chart-subtitle">Monthly revenue and order trends</div>
          </div>
          <div class="legend">
            <span class="legend-item">
              <span class="legend-dot" style="background:var(--accent)"></span>Revenue
            </span>
            <span class="legend-item">
              <span class="legend-dot" style="background:var(--info)"></span>Orders
            </span>
          </div>
        </div>
        <div class="chart-area">
          <svg viewBox="0 0 ${this._w} ${this._h}" preserveAspectRatio="none">
            <!-- Grid lines -->
            ${gridLevels.map((pct) => {
              const y = this._padT + (1 - pct) * (this._h - this._padT - this._padB)
              const val = Math.round(pct * this._maxRevenue / 1000)
              return html`
                <line class="grid-line" x1="${this._padL}" y1="${y}" x2="${this._w - this._padR}" y2="${y}" />
                <text class="y-label" x="${this._padL - 8}" y="${y + 4}" text-anchor="end">${val}k</text>
              `
            })}

            <!-- Areas -->
            <path class="area-revenue" d="${this._areaPath((d) => d.revenue, this._yRev.bind(this))}" />
            <path class="area-orders" d="${this._areaPath((d) => d.orders, this._yOrd.bind(this))}" />

            <!-- Lines -->
            <polyline class="line-revenue" points="${this._polyline((d) => d.revenue, this._yRev.bind(this))}" />
            <polyline class="line-orders" points="${this._polyline((d) => d.orders, this._yOrd.bind(this))}" />

            <!-- Data points & labels -->
            ${monthlyData.map((d, i) => html`
              <circle
                class="data-point"
                cx="${this._x(i)}" cy="${this._yRev(d.revenue)}" r="3.5"
                fill="var(--accent)" stroke="var(--bg-card)" stroke-width="2"
                @mouseenter=${() => (this._hoveredIndex = i)}
                @mouseleave=${() => (this._hoveredIndex = null)}
                style="pointer-events:all"
              />
              <circle
                class="data-point"
                cx="${this._x(i)}" cy="${this._yOrd(d.orders)}" r="3.5"
                fill="var(--info)" stroke="var(--bg-card)" stroke-width="2"
              />
              <text class="x-label" x="${this._x(i)}" y="${bottom + 22}">${d.label}</text>
            `)}

            <!-- Tooltip -->
            ${this._hoveredIndex !== null ? (() => {
              const d = monthlyData[this._hoveredIndex]
              const tx = this._x(this._hoveredIndex)
              const ty = this._yRev(d.revenue) - 44
              return html`
                <g class="tooltip-group">
                  <rect class="tooltip-bg" x="${tx - 52}" y="${ty}" width="104" height="36" />
                  <text class="tooltip-text" x="${tx}" y="${ty + 15}" text-anchor="middle">$${(d.revenue / 1000).toFixed(1)}k</text>
                  <text class="tooltip-sub" x="${tx}" y="${ty + 28}" text-anchor="middle">${d.orders} orders</text>
                </g>
              `
            })() : ''}
          </svg>
        </div>
      </div>
    `
  }
}
