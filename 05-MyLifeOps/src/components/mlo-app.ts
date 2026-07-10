import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { currentUserSignal, navigateTo } from '../state/global-store';
import { SupabaseSyncController } from '../controllers/supabase-sync';

// Import subcomponents
import './mlo-dashboard';
import './mlo-module';

@customElement('mlo-app')
export class MloApp extends SignalWatcher(LitElement) {
  @property({ attribute: false })
  syncController!: SupabaseSyncController;

  static styles = css`
    :host {
      min-height: 100vh;
      background-color: var(--bg);
      color: var(--text);
      transition: background-color var(--tr), color var(--tr);
      display: flex;
      flex-direction: column;
    }

    .layout-wrapper {
      display: flex;
      flex: 1;
    }

    main {
      flex: 1;
      padding: var(--sp-md);
    }
  `;

  render() {
    const currentUser = currentUserSignal.value;
    
    // SSR safety check
    if (typeof window === 'undefined') {
      return html`<div>Loading...</div>`;
    }

    if (!currentUser) {
      return this.renderLoginPrompt();
    }

    return html`
      <div class="layout-wrapper">
        <main>
          ${this._renderActiveViewport()}
        </main>
      </div>
    `;
  }

  private renderLoginPrompt() {
    return html`
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh;">
        <button @click="${this._handleLogin}" style="padding: var(--sp-md); border-radius: var(--r); background: var(--surface); border: 1px solid var(--border); cursor: pointer;">
          Login to MyLifeOps
        </button>
      </div>
    `;
  }

  private _renderActiveViewport() {
    const currentView = 'home'; // In a real implementation, this would come from a signal
    
    switch (currentView) {
      case 'home':
        return html`<mlo-dashboard .syncController="${this.syncController}"></mlo-dashboard>`;
      case 'module-detail':
        return html`<mlo-module .syncController="${this.syncController}"></mlo-module>`;
      default:
        return html`<mlo-dashboard .syncController="${this.syncController}"></mlo-dashboard>`;
    }
  }

  private _handleLogin() {
    // In a real implementation, this would call Supabase auth
    // For now, we'll simulate a successful login
    currentUserSignal.value = { id: 'mock-user-id' };
  }
}