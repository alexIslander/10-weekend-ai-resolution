import { LitElement, html, css } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import type { AppPage } from '../app/navigation'
import { themeStyles, resetStyles } from '../styles/theme'
import { icons } from '../icons'

@customElement('top-navbar')
export class TopNavbar extends LitElement {
  static styles = [
    themeStyles,
    resetStyles,
    css`
      :host {
        display: block;
      }
      header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 24px;
        height: 65px;
        background: var(--bg-card);
        border-bottom: 1px solid var(--border);
        position: sticky;
        top: 0;
        z-index: 30;
      }
      .left {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .hamburger {
        display: none;
        background: none;
        border: none;
        cursor: pointer;
        color: var(--fg-muted);
        padding: 6px;
        border-radius: var(--radius-sm);
        transition: all var(--transition);
      }
      .hamburger:hover { color: var(--fg); background: var(--bg-input); }
      @media (max-width: 768px) {
        .hamburger { display: flex; align-items: center; }
      }
      .breadcrumb {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        color: var(--fg-muted);
      }
      .breadcrumb-current {
        color: var(--fg);
        font-weight: 500;
      }
      .breadcrumb-sep {
        color: var(--fg-subtle);
      }
      @media (max-width: 480px) {
        .breadcrumb { display: none; }
      }

      .right {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .search-box {
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--bg-input);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 7px 12px;
        margin-right: 8px;
        transition: all var(--transition);
      }
      .search-box:focus-within {
        border-color: var(--accent);
        box-shadow: 0 0 0 3px var(--accent-subtle);
      }
      .search-box svg { color: var(--fg-subtle); }
      .search-input {
        background: none;
        border: none;
        outline: none;
        font-size: 13px;
        color: var(--fg);
        font-family: var(--font-sans);
        width: 160px;
      }
      .search-input::placeholder { color: var(--fg-subtle); }
      @media (max-width: 640px) {
        .search-box { display: none; }
      }

      .icon-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: var(--radius);
        background: none;
        border: none;
        cursor: pointer;
        color: var(--fg-muted);
        position: relative;
        transition: all var(--transition);
      }
      .icon-btn:hover {
        background: var(--bg-input);
        color: var(--fg);
      }
      .notif-dot {
        position: absolute;
        top: 6px;
        right: 6px;
        width: 8px;
        height: 8px;
        background: var(--accent);
        border-radius: 50%;
        border: 2px solid var(--bg-card);
      }

      @media (max-width: 768px) {
        header { padding: 0 16px; }
      }
    `,
  ]

  @property({ type: String }) theme: 'light' | 'dark' = 'dark'
  @property({ type: Boolean }) sidebarCollapsed = false
  @property({ type: String }) activePage: AppPage = 'dashboard'
  @property({ type: String }) pageLabel = 'Dashboard'

  private _dispatch(name: string) {
    this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true }))
  }

  render() {
    return html`
      <header>
        <div class="left">
          <button class="hamburger" @click=${() => this._dispatch('toggle-mobile-sidebar')} aria-label="Open sidebar">
            ${icons.menu}
          </button>
          <div class="breadcrumb">
            <span>Home</span>
            <span class="breadcrumb-sep">/</span>
            <span class="breadcrumb-current">${this.pageLabel}</span>
          </div>
        </div>
        <div class="right">
          <div class="search-box">
            ${icons.search}
            <input class="search-input" type="text" placeholder="Search..." aria-label="Search" />
          </div>
          <button class="icon-btn" aria-label="Notifications">
            ${icons.bell}
            <span class="notif-dot"></span>
          </button>
          <button class="icon-btn" @click=${() => this._dispatch('toggle-theme')} aria-label="Toggle theme">
            ${this.theme === 'dark' ? icons.sun : icons.moon}
          </button>
        </div>
      </header>
    `
  }
}
