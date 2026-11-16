import { LitElement, html, css } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { themeStyles, resetStyles } from '../styles/theme'
import { icons } from '../icons'

@customElement('login-card')
export class LoginCard extends LitElement {
  static styles = [
    themeStyles,
    resetStyles,
    css`
      :host {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: var(--bg);
        padding: 16px;
        position: relative;
      }
      .card {
        width: 100%;
        max-width: 400px;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-xl);
        padding: 40px 32px;
        box-shadow: var(--shadow-md);
        position: relative;
        overflow: hidden;
      }
      .card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: var(--accent);
      }
      .theme-btn {
        position: absolute;
        top: 24px;
        right: 24px;
        background: var(--bg-input);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 8px;
        cursor: pointer;
        color: var(--fg-muted);
        display: flex;
        align-items: center;
        transition: all var(--transition);
      }
      .theme-btn:hover {
        color: var(--fg);
        border-color: var(--accent);
      }
      .logo {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 32px;
      }
      .logo-icon {
        width: 40px;
        height: 40px;
        background: var(--accent);
        border-radius: var(--radius);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--fg-invert);
      }
      .logo-text {
        font-size: 20px;
        font-weight: 700;
        letter-spacing: -0.02em;
      }
      h2 {
        font-size: 22px;
        font-weight: 600;
        margin-bottom: 6px;
        letter-spacing: -0.02em;
      }
      .subtitle {
        color: var(--fg-muted);
        font-size: 14px;
        margin-bottom: 28px;
        line-height: 1.5;
      }
      label {
        display: block;
        font-size: 13px;
        font-weight: 500;
        color: var(--fg-muted);
        margin-bottom: 6px;
      }
      .input-wrapper {
        position: relative;
        margin-bottom: 20px;
      }
      .input-icon {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--fg-subtle);
        display: flex;
      }
      input {
        width: 100%;
        padding: 10px 12px 10px 40px;
        background: var(--bg-input);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        font-size: 14px;
        font-family: var(--font-sans);
        color: var(--fg);
        outline: none;
        transition: all var(--transition);
      }
      input:focus {
        border-color: var(--accent);
        box-shadow: 0 0 0 3px var(--accent-subtle);
      }
      input::placeholder {
        color: var(--fg-subtle);
      }
      .error-msg {
        color: var(--danger);
        font-size: 13px;
        margin-bottom: 16px;
        display: none;
      }
      .error-msg.visible {
        display: block;
      }
      button[type="submit"] {
        width: 100%;
        padding: 12px;
        background: var(--accent);
        color: var(--fg-invert);
        border: none;
        border-radius: var(--radius);
        font-size: 14px;
        font-weight: 600;
        font-family: var(--font-sans);
        cursor: pointer;
        transition: all var(--transition);
        letter-spacing: -0.01em;
      }
      button[type="submit"]:hover {
        background: var(--accent-hover);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px var(--accent-subtle);
      }
      button[type="submit"]:active {
        transform: translateY(0);
      }
      .footer-text {
        text-align: center;
        font-size: 12px;
        color: var(--fg-subtle);
        margin-top: 24px;
      }
    `,
  ]

  @property({ type: String }) theme: 'light' | 'dark' = 'dark'
  @state() private _error = false

  private _handleSubmit(e: Event) {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const data = new FormData(form)
    const email = data.get('email') as string
    const password = data.get('password') as string

    if (email && password) {
      this._error = false
      this.dispatchEvent(new CustomEvent('login-success', { bubbles: true, composed: true }))
    } else {
      this._error = true
    }
  }

  render() {
    return html`
      <div class="card">
        <button class="theme-btn" @click=${() => this.dispatchEvent(new CustomEvent('toggle-theme', { bubbles: true, composed: true }))}>
          ${this.theme === 'dark' ? icons.sun : icons.moon}
        </button>
        <div class="logo">
          <div class="logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <span class="logo-text">AdminPanel</span>
        </div>
        <h2>Welcome back</h2>
        <p class="subtitle">Enter your credentials to access the dashboard</p>
        <form @submit=${this._handleSubmit}>
          <label for="email">Email</label>
          <div class="input-wrapper">
            <span class="input-icon">${icons.mail}</span>
            <input type="email" id="email" name="email" placeholder="admin@company.com" value="admin@company.com" />
          </div>
          <label for="password">Password</label>
          <div class="input-wrapper">
            <span class="input-icon">${icons.lock}</span>
            <input type="password" id="password" name="password" placeholder="Enter password" value="password" />
          </div>
          <p class="error-msg ${this._error ? 'visible' : ''}">Please fill in all fields.</p>
          <button type="submit">Sign In</button>
        </form>
        <p class="footer-text">Demo mode - any credentials work</p>
      </div>
    `
  }
}
