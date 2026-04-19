import { LitElement, html, css } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import type { AppPage, NavItem } from '../app/navigation'
import { themeStyles, resetStyles } from '../styles/theme'
import { icons } from '../icons'

@customElement('app-sidebar')
export class AppSidebar extends LitElement {
  static styles = [
    themeStyles,
    resetStyles,
    css`
      :host {
        display: block;
      }

      /* Overlay for mobile */
      .overlay {
        display: none;
        position: fixed;
        inset: 0;
        background: var(--bg-overlay);
        z-index: 40;
        opacity: 0;
        transition: opacity var(--transition);
      }
      .overlay.visible {
        display: block;
        opacity: 1;
      }

      aside {
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        background: var(--bg-sidebar);
        border-right: 1px solid var(--border);
        display: flex;
        flex-direction: column;
        z-index: 50;
        transition: width var(--transition), transform var(--transition);
        overflow: hidden;
        width: 260px;
      }
      aside.collapsed {
        width: 68px;
      }

      /* Mobile: sidebar slides in from left */
      @media (max-width: 768px) {
        aside {
          transform: translateX(-100%);
          width: 280px !important;
        }
        aside.mobile-open {
          transform: translateX(0);
        }
      }

      /* Desktop: spacer pushes content */
      .spacer {
        width: 260px;
        flex-shrink: 0;
        transition: width var(--transition);
      }
      .spacer.collapsed {
        width: 68px;
      }
      @media (max-width: 768px) {
        .spacer {
          display: none;
        }
      }

      .logo {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 20px;
        border-bottom: 1px solid var(--border);
        min-height: 65px;
      }
      .logo-icon {
        width: 32px;
        height: 32px;
        min-width: 32px;
        background: var(--accent);
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--fg-invert);
      }
      .logo-text {
        font-size: 16px;
        font-weight: 700;
        letter-spacing: -0.03em;
        white-space: nowrap;
        overflow: hidden;
        opacity: 1;
        transition: opacity var(--transition);
      }
      aside.collapsed .logo-text {
        opacity: 0;
        width: 0;
      }

      nav {
        flex: 1;
        padding: 12px 8px;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .nav-section-label {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--fg-subtle);
        padding: 8px 12px 4px;
        white-space: nowrap;
        overflow: hidden;
      }
      aside.collapsed .nav-section-label {
        opacity: 0;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border-radius: var(--radius);
        cursor: pointer;
        color: var(--fg-muted);
        font-size: 14px;
        font-weight: 500;
        border: none;
        background: none;
        width: 100%;
        text-align: left;
        font-family: var(--font-sans);
        transition: all var(--transition);
        white-space: nowrap;
        overflow: hidden;
      }
      .nav-item:hover {
        background: var(--bg-sidebar-hover);
        color: var(--fg);
      }
      .nav-item.active {
        background: var(--accent-subtle);
        color: var(--accent);
      }
      .nav-icon {
        min-width: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .nav-label {
        opacity: 1;
        transition: opacity var(--transition);
      }
      aside.collapsed .nav-label {
        opacity: 0;
      }

      .sidebar-footer {
        padding: 12px;
        border-top: 1px solid var(--border);
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .collapse-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 10px;
        border-radius: var(--radius);
        cursor: pointer;
        color: var(--fg-subtle);
        font-size: 13px;
        border: none;
        background: none;
        width: 100%;
        font-family: var(--font-sans);
        transition: all var(--transition);
      }
      .collapse-btn:hover {
        background: var(--bg-sidebar-hover);
        color: var(--fg);
      }
      .user-info {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px;
        border-radius: var(--radius);
        overflow: hidden;
      }
      .avatar {
        width: 32px;
        height: 32px;
        min-width: 32px;
        border-radius: 50%;
        background: var(--accent);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 13px;
        color: var(--fg-invert);
      }
      .user-details {
        overflow: hidden;
        opacity: 1;
        transition: opacity var(--transition);
      }
      aside.collapsed .user-details {
        opacity: 0;
        width: 0;
      }
      .user-name {
        font-size: 13px;
        font-weight: 600;
        white-space: nowrap;
      }
      .user-email {
        font-size: 11px;
        color: var(--fg-subtle);
        white-space: nowrap;
      }

      .logout-btn {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: var(--radius);
        cursor: pointer;
        color: var(--fg-muted);
        font-size: 13px;
        border: none;
        background: none;
        width: 100%;
        text-align: left;
        font-family: var(--font-sans);
        transition: all var(--transition);
      }
      .logout-btn:hover {
        background: var(--danger-bg);
        color: var(--danger);
      }
      .logout-label {
        opacity: 1;
        transition: opacity var(--transition);
        white-space: nowrap;
      }
      aside.collapsed .logout-label {
        opacity: 0;
      }

      @media (max-width: 768px) {
        .collapse-btn { display: none; }
      }
    `,
  ]

  @property({ type: Boolean }) collapsed = false
  @property({ type: Boolean }) mobileOpen = false
  @property({ attribute: false }) items: NavItem[] = []
  @property({ type: String }) activePage: AppPage = 'dashboard'

  private _dispatch(name: string) {
    this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true }))
  }

  render() {
    return html`
      <div class="overlay ${this.mobileOpen ? 'visible' : ''}" @click=${() => this._dispatch('close-mobile-sidebar')}></div>
      <div class="spacer ${this.collapsed ? 'collapsed' : ''}"></div>
      <aside class="${this.collapsed ? 'collapsed' : ''} ${this.mobileOpen ? 'mobile-open' : ''}">
        <div class="logo">
          <div class="logo-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <span class="logo-text">AdminPanel</span>
        </div>

        <nav>
          <span class="nav-section-label">Platform</span>
          ${this.items.map(
            (item) => html`
              <button
                class="nav-item ${this.activePage === item.id ? 'active' : ''}"
                aria-label=${item.label}
                @click=${() => this.dispatchEvent(new CustomEvent('navigate', { detail: { page: item.id }, bubbles: true, composed: true }))}
              >
                <span class="nav-icon">${icons[item.icon]}</span>
                <span class="nav-label">${item.label}</span>
              </button>
            `
          )}
        </nav>

        <div class="sidebar-footer">
          <div class="user-info">
            <div class="avatar">JD</div>
            <div class="user-details">
              <div class="user-name">Jane Doe</div>
              <div class="user-email">jane@company.com</div>
            </div>
          </div>
          <button class="logout-btn" @click=${() => this._dispatch('logout')} aria-label="Log out">
            <span class="nav-icon">${icons.logOut}</span>
            <span class="logout-label">Log Out</span>
          </button>
          <button class="collapse-btn" @click=${() => this._dispatch('toggle-sidebar')} aria-label="Collapse sidebar">
            ${this.collapsed ? icons.chevronRight : icons.chevronLeft}
            <span class="nav-label">${this.collapsed ? '' : 'Collapse'}</span>
          </button>
        </div>
      </aside>
    `
  }
}
