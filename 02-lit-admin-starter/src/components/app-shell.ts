import { LitElement, html, css } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { defaultPage, getPageMeta, type AppPage, navItems } from '../app/navigation'
import '../features/analytics/analytics-boundary'
import '../features/customers/customers-boundary'
import '../features/dashboard/dashboard-boundary'
import '../features/orders/orders-boundary'
import '../features/settings/settings-boundary'
import { themeStyles, resetStyles } from '../styles/theme'

@customElement('app-shell')
export class AppShell extends LitElement {
  static styles = [
    themeStyles,
    resetStyles,
    css`
      :host {
        display: block;
        min-height: 100vh;
        background: var(--bg);
        color: var(--fg);
        transition: background var(--transition), color var(--transition);
      }
      .app-layout {
        display: flex;
        min-height: 100vh;
      }
      .main-area {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
        transition: margin-left var(--transition);
      }
      .content {
        flex: 1;
        padding: 24px;
        overflow-y: auto;
      }
      .page-header {
        display: grid;
        gap: 6px;
        margin-bottom: 24px;
      }
      .page-kicker {
        color: var(--accent);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      h1 {
        font-size: 32px;
        letter-spacing: -0.05em;
      }
      .page-description {
        color: var(--fg-muted);
        line-height: 1.6;
        max-width: 70ch;
      }
      @media (max-width: 768px) {
        .content {
          padding: 16px;
        }
      }
    `,
  ]

  @property({ type: String, reflect: true }) theme: 'light' | 'dark' = 'dark'
  @state() private _authenticated = false
  @state() private _sidebarCollapsed = false
  @state() private _mobileSidebarOpen = false
  @state() private _activePage: AppPage = defaultPage

  connectedCallback() {
    super.connectedCallback()
    const saved = localStorage.getItem('dashboard-theme')
    if (saved === 'light' || saved === 'dark') {
      this.theme = saved
    }
  }

  private _toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('dashboard-theme', this.theme)
  }

  private _handleLogin() {
    this._authenticated = true
  }

  private _handleLogout() {
    this._authenticated = false
    this._activePage = defaultPage
  }

  private _toggleSidebar() {
    this._sidebarCollapsed = !this._sidebarCollapsed
  }

  private _toggleMobileSidebar() {
    this._mobileSidebarOpen = !this._mobileSidebarOpen
  }

  private _handleNavigate(e: CustomEvent) {
    this._activePage = e.detail.page
    this._mobileSidebarOpen = false
  }

  private _renderPage() {
    switch (this._activePage) {
      case 'customers':
        return html`<customers-boundary theme=${this.theme}></customers-boundary>`
      case 'orders':
        return html`<orders-boundary theme=${this.theme}></orders-boundary>`
      case 'analytics':
        return html`<analytics-boundary theme=${this.theme}></analytics-boundary>`
      case 'settings':
        return html`<settings-boundary></settings-boundary>`
      case 'dashboard':
      default:
        return html`<dashboard-boundary theme=${this.theme}></dashboard-boundary>`
    }
  }

  render() {
    const pageMeta = getPageMeta(this._activePage)

    if (!this._authenticated) {
      return html`
        <login-card
          theme=${this.theme}
          @login-success=${this._handleLogin}
          @toggle-theme=${this._toggleTheme}
        ></login-card>
      `
    }

    return html`
      <div class="app-layout">
        <app-sidebar
          theme=${this.theme}
          .collapsed=${this._sidebarCollapsed}
          .mobileOpen=${this._mobileSidebarOpen}
          .items=${navItems}
          .activePage=${this._activePage}
          @toggle-sidebar=${this._toggleSidebar}
          @close-mobile-sidebar=${() => (this._mobileSidebarOpen = false)}
          @logout=${this._handleLogout}
          @navigate=${this._handleNavigate}
        ></app-sidebar>
        <div class="main-area">
          <top-navbar
            theme=${this.theme}
            .sidebarCollapsed=${this._sidebarCollapsed}
            .pageLabel=${pageMeta.label}
            .activePage=${this._activePage}
            @toggle-theme=${this._toggleTheme}
            @toggle-sidebar=${this._toggleSidebar}
            @toggle-mobile-sidebar=${this._toggleMobileSidebar}
            @logout=${this._handleLogout}
          ></top-navbar>
          <main class="content">
            <header class="page-header">
              <div class="page-kicker">Admin starter</div>
              <h1>${pageMeta.label}</h1>
              <p class="page-description">${pageMeta.description}</p>
            </header>
            ${this._renderPage()}
          </main>
        </div>
      </div>
    `
  }
}
