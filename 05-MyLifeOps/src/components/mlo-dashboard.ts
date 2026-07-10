import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { currentUserSignal } from '../state/global-store';
import { SupabaseSyncController } from '../controllers/supabase-sync';
import { UserProfile } from '../models/types';
import { MetricCard } from './shared/metric-card';

@customElement('mlo-dashboard')
export class MloDashboard extends SignalWatcher(LitElement) {
  @property({ attribute: false })
  syncController!: SupabaseSyncController;

  static styles = css`
    :host {
      display: block;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: var(--sp-md);
      margin-bottom: var(--sp-lg);
    }

    .module-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--sp-md);
    }

    .module-card {
      background-color: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--r);
      padding: var(--sp-md);
      cursor: pointer;
      transition: transform var(--tr);
    }

    .module-card:hover {
      transform: translateY(-2px);
    }

    .module-card h3 {
      margin-top: 0;
      margin-bottom: var(--sp-sm);
    }
  `;

  render() {
    const currentUser = currentUserSignal.value;
    
    if (!currentUser) {
      return html`<div>Please log in</div>`;
    }

    // Mock user profile data
    const userProfile: UserProfile = {
      id: currentUser.id,
      total_xp: 1250,
      created_at: new Date().toISOString()
    };

    // Calculate level (simplified)
    const level = Math.floor(userProfile.total_xp / 100) + 1;

    return html`
      <div>
        <h1>Welcome back!</h1>
        
        <div class="metrics-grid">
          <metric-card label="XP" .value="${userProfile.total_xp}"></metric-card>
          <metric-card label="Level" .value="${level}"></metric-card>
        </div>

        <h2>Modules</h2>
        <div class="module-list">
          <div class="module-card" @click="${() => this._triggerRoute('superhuman-routine')}">
            <h3>Superhuman Routine</h3>
            <p>Master the art of peak performance</p>
          </div>
          <div class="module-card" @click="${() => this._triggerRoute('culinary-operations')}">
            <h3>Culinary Operations</h3>
            <p>Transform your kitchen into a culinary lab</p>
          </div>
          <div class="module-card" @click="${() => this._triggerRoute('mindfulness-practice')}">
            <h3>Mindfulness Practice</h3>
            <p>Cultivate presence and awareness</p>
          </div>
        </div>
      </div>
    `;
  }

  private _triggerRoute(moduleId: string) {
    // In a real implementation, this would navigate to the module
    // For now, we'll just log it
    console.log(`Navigating to module: ${moduleId}`);
  }
}