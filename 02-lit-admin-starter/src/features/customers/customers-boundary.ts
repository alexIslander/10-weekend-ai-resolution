import { LitElement, css, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

import { icons } from '../../icons'
import { resetStyles, themeStyles } from '../../styles/theme'
import type { Customer, CustomerHealth, CustomerTier } from './customer-entity'
import { CustomersControl } from './customers-control'

@customElement('customers-boundary')
export class CustomersBoundary extends LitElement {
  static styles = [
    themeStyles,
    resetStyles,
    css`
      :host {
        display: grid;
        gap: 24px;
      }

      .summary {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
      }

      .metric {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: 20px;
      }

      .metric-label {
        color: var(--fg-muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .metric-value {
        font-size: 28px;
        font-weight: 700;
        letter-spacing: -0.04em;
        margin-top: 8px;
      }

      .workspace {
        display: grid;
        grid-template-columns: minmax(0, 1.7fr) minmax(300px, 0.9fr);
        gap: 24px;
      }

      .panel {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-xl);
        overflow: hidden;
      }

      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 20px 24px;
        border-bottom: 1px solid var(--border);
      }

      .panel-title {
        font-size: 18px;
        font-weight: 700;
        letter-spacing: -0.03em;
      }

      .panel-subtitle {
        color: var(--fg-muted);
        font-size: 13px;
        margin-top: 4px;
      }

      .toolbar {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 20px 24px 0;
      }

      .search-box,
      .select-wrap,
      input,
      select {
        font: inherit;
      }

      .search-box {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 10px;
        background: var(--bg-input);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 10px 12px;
      }

      .search-box svg {
        color: var(--fg-subtle);
      }

      .search-box input {
        width: 100%;
        border: none;
        background: transparent;
        color: var(--fg);
        outline: none;
      }

      .select-wrap select,
      .field input,
      .field select {
        width: 100%;
        border: 1px solid var(--border);
        background: var(--bg-input);
        color: var(--fg);
        border-radius: var(--radius);
        padding: 10px 12px;
        outline: none;
      }

      .actions {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-radius: var(--radius);
        border: 1px solid var(--border);
        background: var(--bg-card);
        color: var(--fg);
        font-weight: 600;
        padding: 10px 14px;
        cursor: pointer;
        transition: all var(--transition);
      }

      .button:hover {
        border-color: var(--accent);
        color: var(--accent);
      }

      .button.primary {
        border-color: var(--accent);
        background: var(--accent);
        color: var(--fg-invert);
      }

      .button.primary:hover {
        background: var(--accent-hover);
        color: var(--fg-invert);
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th,
      td {
        padding: 14px 24px;
        border-bottom: 1px solid var(--border-subtle);
        text-align: left;
        vertical-align: middle;
      }

      th {
        color: var(--fg-subtle);
        font-size: 12px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      tbody tr:hover {
        background: var(--bg-input);
      }

      .company {
        display: grid;
        gap: 2px;
      }

      .company strong {
        font-size: 14px;
      }

      .company span {
        color: var(--fg-muted);
        font-size: 12px;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border-radius: 999px;
        padding: 4px 10px;
        font-size: 12px;
        font-weight: 700;
      }

      .tier-enterprise {
        background: color-mix(in srgb, var(--accent) 14%, transparent);
        color: var(--accent);
      }

      .tier-growth {
        background: color-mix(in srgb, var(--info) 14%, transparent);
        color: var(--info);
      }

      .tier-starter {
        background: color-mix(in srgb, var(--warning) 14%, transparent);
        color: var(--warning);
      }

      .health-healthy {
        background: var(--success-bg);
        color: var(--success);
      }

      .health-at-risk {
        background: var(--danger-bg);
        color: var(--danger);
      }

      .health-new {
        background: var(--info-bg);
        color: var(--info);
      }

      .table-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .icon-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border-radius: var(--radius);
        border: 1px solid var(--border);
        background: transparent;
        color: var(--fg-muted);
        cursor: pointer;
      }

      .icon-button:hover {
        border-color: var(--accent);
        color: var(--accent);
      }

      .form {
        padding: 24px;
        display: grid;
        gap: 16px;
      }

      .field-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .field {
        display: grid;
        gap: 6px;
      }

      .field label {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--fg-subtle);
      }

      .form-footer {
        display: flex;
        gap: 10px;
      }

      .empty {
        padding: 32px 24px;
        color: var(--fg-muted);
      }

      @media (max-width: 1080px) {
        .workspace {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 720px) {
        .summary,
        .field-grid {
          grid-template-columns: 1fr;
        }

        .toolbar,
        .panel-header {
          flex-direction: column;
          align-items: stretch;
        }

        th:nth-child(4),
        td:nth-child(4),
        th:nth-child(6),
        td:nth-child(6) {
          display: none;
        }
      }
    `,
  ]

  @property({ type: String }) theme: 'light' | 'dark' = 'dark'
  @state() private revision = 0

  private readonly control = new CustomersControl(() => {
    this.revision += 1
  })

  private _onInput(event: Event, field: string) {
    const target = event.target as HTMLInputElement | HTMLSelectElement
    if (field === 'priority') {
      this.control.updateDraft('priority', (target as HTMLInputElement).checked)
      return
    }
    this.control.updateDraft(field as never, target.value as never)
  }

  private _tierClass(tier: CustomerTier) {
    return `tier-${tier.toLowerCase()}`
  }

  private _healthClass(health: CustomerHealth) {
    return `health-${health.toLowerCase().replace(' ', '-')}`
  }

  private _formatRevenue(value: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value)
  }

  private _renderRow(customer: Customer) {
    return html`
      <tr>
        <td>
          <div class="company">
            <strong>${customer.company}</strong>
            <span>${customer.id}</span>
          </div>
        </td>
        <td>
          <div class="company">
            <strong>${customer.name}</strong>
            <span>${customer.email}</span>
          </div>
        </td>
        <td><span class="badge ${this._tierClass(customer.tier)}">${customer.tier}</span></td>
        <td>${customer.owner}</td>
        <td>${customer.seats}</td>
        <td>${this._formatRevenue(customer.monthlyRevenue)}</td>
        <td><span class="badge ${this._healthClass(customer.health)}">${customer.health}</span></td>
        <td>
          <div class="table-actions">
            <button
              class="icon-button"
              @click=${() => this.control.togglePriority(customer.id)}
              aria-label="Toggle priority"
              title="Toggle priority"
            >
              ${customer.priority ? icons.starFilled : icons.star}
            </button>
            <button class="icon-button" @click=${() => this.control.startEdit(customer.id)} aria-label="Edit customer">
              ${icons.edit}
            </button>
            <button class="icon-button" @click=${() => this.control.deleteCustomer(customer.id)} aria-label="Delete customer">
              ${icons.trash}
            </button>
          </div>
        </td>
      </tr>
    `
  }

  render() {
    const { customers, draft, editingId, formVisible, search, stats, statusFilter } = this.control.view

    return html`
      <section class="summary">
        <article class="metric">
          <div class="metric-label">Visible customers</div>
          <div class="metric-value">${stats.totalCustomers}</div>
        </article>
        <article class="metric">
          <div class="metric-label">Monthly recurring revenue</div>
          <div class="metric-value">${this._formatRevenue(stats.monthlyRevenue)}</div>
        </article>
        <article class="metric">
          <div class="metric-label">Priority accounts</div>
          <div class="metric-value">${stats.priorityCount}</div>
        </article>
      </section>

      <section class="workspace">
        <div class="panel">
          <div class="panel-header">
            <div>
              <div class="panel-title">Customer workspace</div>
              <div class="panel-subtitle">Sample BCE feature: in-memory control plus editable boundary.</div>
            </div>
            <div class="actions">
              <button class="button primary" @click=${() => this.control.startCreate()}>
                ${icons.plus}
                <span>New customer</span>
              </button>
            </div>
          </div>

          <div class="toolbar">
            <label class="search-box">
              ${icons.search}
              <input
                .value=${search}
                @input=${(event: Event) => this.control.setSearch((event.target as HTMLInputElement).value)}
                placeholder="Search company, owner, or email"
                aria-label="Search customers"
              />
            </label>
            <div class="select-wrap">
              <select
                .value=${statusFilter}
                @change=${(event: Event) => this.control.setStatusFilter((event.target as HTMLSelectElement).value as CustomerHealth | 'All')}
                aria-label="Filter health"
              >
                <option>All</option>
                <option>Healthy</option>
                <option>At Risk</option>
                <option>New</option>
              </select>
            </div>
          </div>

          ${customers.length === 0
            ? html`<div class="empty">No customers match the current search and status filter.</div>`
            : html`
                <table>
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Contact</th>
                      <th>Tier</th>
                      <th>Owner</th>
                      <th>Seats</th>
                      <th>MRR</th>
                      <th>Health</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    ${customers.map((customer) => this._renderRow(customer))}
                  </tbody>
                </table>
              `}
        </div>

        <aside class="panel">
          <div class="panel-header">
            <div>
              <div class="panel-title">${editingId ? 'Edit customer' : 'Customer draft'}</div>
              <div class="panel-subtitle">
                ${formVisible
                  ? 'This form is intentionally local and replaceable with API-backed controls.'
                  : 'Start a draft to see how new feature forms can live beside the list.'}
              </div>
            </div>
          </div>

          ${formVisible
            ? html`
                <form class="form" @submit=${(event: Event) => {
                  event.preventDefault()
                  this.control.saveDraft()
                }}>
                  <div class="field-grid">
                    <label class="field">
                      <span>Name</span>
                      <input .value=${draft.name} @input=${(event: Event) => this._onInput(event, 'name')} />
                    </label>
                    <label class="field">
                      <span>Company</span>
                      <input .value=${draft.company} @input=${(event: Event) => this._onInput(event, 'company')} />
                    </label>
                    <label class="field">
                      <span>Email</span>
                      <input .value=${draft.email} @input=${(event: Event) => this._onInput(event, 'email')} />
                    </label>
                    <label class="field">
                      <span>Owner</span>
                      <input .value=${draft.owner} @input=${(event: Event) => this._onInput(event, 'owner')} />
                    </label>
                    <label class="field">
                      <span>Tier</span>
                      <select .value=${draft.tier} @change=${(event: Event) => this._onInput(event, 'tier')}>
                        <option>Enterprise</option>
                        <option>Growth</option>
                        <option>Starter</option>
                      </select>
                    </label>
                    <label class="field">
                      <span>Health</span>
                      <select .value=${draft.health} @change=${(event: Event) => this._onInput(event, 'health')}>
                        <option>Healthy</option>
                        <option>At Risk</option>
                        <option>New</option>
                      </select>
                    </label>
                    <label class="field">
                      <span>Seats</span>
                      <input .value=${draft.seats} @input=${(event: Event) => this._onInput(event, 'seats')} />
                    </label>
                    <label class="field">
                      <span>Monthly revenue</span>
                      <input .value=${draft.monthlyRevenue} @input=${(event: Event) => this._onInput(event, 'monthlyRevenue')} />
                    </label>
                  </div>

                  <label class="field">
                    <span>Priority account</span>
                    <input type="checkbox" .checked=${draft.priority} @change=${(event: Event) => this._onInput(event, 'priority')} />
                  </label>

                  <div class="form-footer">
                    <button class="button primary" type="submit">${editingId ? 'Save changes' : 'Create customer'}</button>
                    <button class="button" type="button" @click=${() => this.control.cancelEdit()}>Cancel</button>
                  </div>
                </form>
              `
            : html`<div class="empty">No draft open. Use "New customer" or edit an existing row to begin.</div>`}
        </aside>
      </section>
    `
  }
}
