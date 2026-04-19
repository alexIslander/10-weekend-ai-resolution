import { LitElement, html, css } from 'lit'
import { customElement } from 'lit/decorators.js'
import { themeStyles, resetStyles } from '../styles/theme'
import { icons } from '../icons'

interface KpiData {
  label: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: keyof typeof icons
  iconColor: string
  iconBg: string
}

const kpis: KpiData[] = [
  {
    label: 'Total Revenue',
    value: '$48,352',
    change: '+12.5%',
    trend: 'up',
    icon: 'dollarSign',
    iconColor: 'var(--accent)',
    iconBg: 'var(--accent-subtle)',
  },
  {
    label: 'Active Users',
    value: '2,847',
    change: '+8.2%',
    trend: 'up',
    icon: 'users',
    iconColor: 'var(--info)',
    iconBg: 'var(--info-bg)',
  },
  {
    label: 'Total Orders',
    value: '1,423',
    change: '-3.1%',
    trend: 'down',
    icon: 'shoppingCart',
    iconColor: 'var(--warning)',
    iconBg: 'var(--warning-bg)',
  },
  {
    label: 'Conversion',
    value: '3.24%',
    change: '+1.8%',
    trend: 'up',
    icon: 'activity',
    iconColor: 'var(--success)',
    iconBg: 'var(--success-bg)',
  },
]

@customElement('kpi-cards')
export class KpiCards extends LitElement {
  static styles = [
    themeStyles,
    resetStyles,
    css`
      .grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
      }
      @media (max-width: 1024px) {
        .grid { grid-template-columns: repeat(2, 1fr); }
      }
      @media (max-width: 560px) {
        .grid { grid-template-columns: 1fr; }
      }
      .card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: 24px;
        position: relative;
        overflow: hidden;
        transition: all var(--transition);
        cursor: default;
      }
      .card::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: transparent;
        transition: background var(--transition);
      }
      .card:hover {
        box-shadow: var(--shadow-md);
        border-color: var(--border);
      }
      .card:hover::after {
        background: var(--accent);
      }
      .card-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 16px;
      }
      .card-label {
        font-size: 13px;
        font-weight: 500;
        color: var(--fg-muted);
      }
      .card-icon {
        width: 40px;
        height: 40px;
        border-radius: var(--radius);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform var(--transition);
      }
      .card:hover .card-icon {
        transform: scale(1.1);
      }
      .card-value {
        font-size: 28px;
        font-weight: 700;
        letter-spacing: -0.03em;
        margin-bottom: 8px;
        line-height: 1;
      }
      .card-change {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        font-weight: 500;
        padding: 2px 8px;
        border-radius: 20px;
      }
      .card-change.up {
        color: var(--success);
        background: var(--success-bg);
      }
      .card-change.down {
        color: var(--danger);
        background: var(--danger-bg);
      }
      .vs-label {
        font-size: 12px;
        color: var(--fg-subtle);
        margin-left: 8px;
      }
    `,
  ]

  render() {
    return html`
      <div class="grid">
        ${kpis.map(
          (kpi) => html`
            <div class="card">
              <div class="card-header">
                <span class="card-label">${kpi.label}</span>
                <div class="card-icon" style="background:${kpi.iconBg};color:${kpi.iconColor}">
                  ${icons[kpi.icon]}
                </div>
              </div>
              <div class="card-value">${kpi.value}</div>
              <div>
                <span class="card-change ${kpi.trend}">
                  ${kpi.trend === 'up' ? icons.trendUp : icons.trendDown}
                  ${kpi.change}
                </span>
                <span class="vs-label">vs last month</span>
              </div>
            </div>
          `
        )}
      </div>
    `
  }
}
