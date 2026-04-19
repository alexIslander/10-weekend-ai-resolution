import { LitElement, html, css, nothing } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { themeStyles, resetStyles } from '../styles/theme'
import { icons } from '../icons'

type Status = 'Completed' | 'Processing' | 'Pending' | 'Cancelled'

interface Order {
  id: string
  customer: string
  email: string
  product: string
  amount: string
  status: Status
  date: string
}

const orders: Order[] = [
  { id: 'ORD-7281', customer: 'Alice Chen', email: 'alice@mail.com', product: 'Pro Plan', amount: '$299.00', status: 'Completed', date: 'Feb 26, 2026' },
  { id: 'ORD-7282', customer: 'Marcus Reid', email: 'marcus@mail.com', product: 'Team License', amount: '$1,200.00', status: 'Processing', date: 'Feb 25, 2026' },
  { id: 'ORD-7283', customer: 'Sofia Patel', email: 'sofia@mail.com', product: 'Enterprise', amount: '$4,500.00', status: 'Completed', date: 'Feb 24, 2026' },
  { id: 'ORD-7284', customer: 'James O\'Brien', email: 'james@mail.com', product: 'Starter', amount: '$49.00', status: 'Pending', date: 'Feb 24, 2026' },
  { id: 'ORD-7285', customer: 'Yuki Tanaka', email: 'yuki@mail.com', product: 'Pro Plan', amount: '$299.00', status: 'Cancelled', date: 'Feb 23, 2026' },
  { id: 'ORD-7286', customer: 'Liam Foster', email: 'liam@mail.com', product: 'Team License', amount: '$1,200.00', status: 'Completed', date: 'Feb 23, 2026' },
  { id: 'ORD-7287', customer: 'Emma Wilson', email: 'emma@mail.com', product: 'Enterprise', amount: '$4,500.00', status: 'Processing', date: 'Feb 22, 2026' },
  { id: 'ORD-7288', customer: 'Noah Davis', email: 'noah@mail.com', product: 'Starter', amount: '$49.00', status: 'Completed', date: 'Feb 22, 2026' },
]

const PAGE_SIZE = 5

@customElement('orders-table')
export class OrdersTable extends LitElement {
  static styles = [
    themeStyles,
    resetStyles,
    css`
      .container {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        overflow: hidden;
      }
      .table-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        border-bottom: 1px solid var(--border);
      }
      .table-title {
        font-size: 16px;
        font-weight: 600;
        letter-spacing: -0.02em;
      }
      .table-subtitle {
        font-size: 13px;
        color: var(--fg-muted);
        margin-top: 2px;
      }
      .view-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 7px 14px;
        border-radius: var(--radius);
        border: 1px solid var(--border);
        background: none;
        font-size: 13px;
        font-weight: 500;
        color: var(--fg-muted);
        cursor: pointer;
        font-family: var(--font-sans);
        transition: all var(--transition);
      }
      .view-btn:hover {
        border-color: var(--accent);
        color: var(--accent);
      }
      .table-wrap {
        overflow-x: auto;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
      }
      thead th {
        text-align: left;
        padding: 12px 24px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--fg-subtle);
        border-bottom: 1px solid var(--border);
        white-space: nowrap;
        user-select: none;
      }
      tbody tr {
        transition: background var(--transition);
      }
      tbody tr:hover {
        background: var(--bg-input);
      }
      td {
        padding: 14px 24px;
        border-bottom: 1px solid var(--border-subtle);
        white-space: nowrap;
      }
      tbody tr:last-child td {
        border-bottom: none;
      }
      .customer-cell {
        display: flex;
        flex-direction: column;
        gap: 1px;
      }
      .customer-name {
        font-weight: 500;
      }
      .customer-email {
        font-size: 12px;
        color: var(--fg-subtle);
      }
      .order-id {
        font-family: var(--font-mono);
        font-size: 13px;
        color: var(--fg-muted);
      }
      .amount {
        font-weight: 600;
        font-variant-numeric: tabular-nums;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        padding: 3px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        white-space: nowrap;
      }
      .badge.completed { color: var(--success); background: var(--success-bg); }
      .badge.processing { color: var(--info); background: var(--info-bg); }
      .badge.pending { color: var(--warning); background: var(--warning-bg); }
      .badge.cancelled { color: var(--danger); background: var(--danger-bg); }

      .dot {
        display: inline-block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        margin-right: 6px;
      }
      .dot.completed { background: var(--success); }
      .dot.processing { background: var(--info); }
      .dot.pending { background: var(--warning); }
      .dot.cancelled { background: var(--danger); }

      .action-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--fg-subtle);
        padding: 4px;
        border-radius: var(--radius-sm);
        transition: all var(--transition);
        display: flex;
        align-items: center;
      }
      .action-btn:hover {
        color: var(--fg);
        background: var(--bg-sidebar-hover);
      }

      .pagination {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 24px;
        border-top: 1px solid var(--border);
        font-size: 13px;
        color: var(--fg-muted);
      }
      .page-btns {
        display: flex;
        gap: 4px;
      }
      .page-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: var(--radius-sm);
        border: 1px solid var(--border);
        background: none;
        cursor: pointer;
        color: var(--fg-muted);
        font-family: var(--font-sans);
        font-size: 13px;
        transition: all var(--transition);
      }
      .page-btn:hover:not(:disabled) {
        border-color: var(--accent);
        color: var(--accent);
      }
      .page-btn:disabled {
        opacity: 0.4;
        cursor: default;
      }
      .page-btn.active {
        background: var(--accent);
        color: var(--fg-invert);
        border-color: var(--accent);
      }

      /* Hide columns on small screens */
      @media (max-width: 768px) {
        .col-product, .col-date { display: none; }
      }
      @media (max-width: 560px) {
        .col-email { display: none; }
        td, th { padding: 10px 14px; }
      }
    `,
  ]

  @state() private _page = 0

  private get _totalPages() {
    return Math.ceil(orders.length / PAGE_SIZE)
  }

  private get _pageOrders() {
    const start = this._page * PAGE_SIZE
    return orders.slice(start, start + PAGE_SIZE)
  }

  render() {
    return html`
      <div class="container">
        <div class="table-header">
          <div>
            <div class="table-title">Recent Orders</div>
            <div class="table-subtitle">${orders.length} orders this month</div>
          </div>
          <button class="view-btn">${icons.eye}<span>View All</span></button>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th class="col-product">Product</th>
                <th>Amount</th>
                <th>Status</th>
                <th class="col-date">Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${this._pageOrders.map(
                (o) => html`
                  <tr>
                    <td><span class="order-id">${o.id}</span></td>
                    <td>
                      <div class="customer-cell">
                        <span class="customer-name">${o.customer}</span>
                        <span class="customer-email col-email">${o.email}</span>
                      </div>
                    </td>
                    <td class="col-product">${o.product}</td>
                    <td><span class="amount">${o.amount}</span></td>
                    <td>
                      <span class="badge ${o.status.toLowerCase()}">
                        <span class="dot ${o.status.toLowerCase()}"></span>
                        ${o.status}
                      </span>
                    </td>
                    <td class="col-date">${o.date}</td>
                    <td>
                      <button class="action-btn" aria-label="More actions">${icons.moreHorizontal}</button>
                    </td>
                  </tr>
                `
              )}
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <span>Showing ${this._page * PAGE_SIZE + 1}-${Math.min((this._page + 1) * PAGE_SIZE, orders.length)} of ${orders.length}</span>
          <div class="page-btns">
            <button class="page-btn" ?disabled=${this._page === 0} @click=${() => (this._page = Math.max(0, this._page - 1))} aria-label="Previous page">
              ${icons.chevronLeft}
            </button>
            ${Array.from({ length: this._totalPages }, (_, i) => html`
              <button class="page-btn ${i === this._page ? 'active' : ''}" @click=${() => (this._page = i)}>${i + 1}</button>
            `)}
            <button class="page-btn" ?disabled=${this._page >= this._totalPages - 1} @click=${() => (this._page = Math.min(this._totalPages - 1, this._page + 1))} aria-label="Next page">
              ${icons.chevronRight}
            </button>
          </div>
        </div>
      </div>
    `
  }
}
