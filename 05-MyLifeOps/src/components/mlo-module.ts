import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { navigateTo } from '../state/global-store';
import { SupabaseSyncController } from '../controllers/supabase-sync';

@customElement('mlo-module')
export class MloModule extends SignalWatcher(LitElement) {
  @property({ attribute: false })
  syncController!: SupabaseSyncController;

  static styles = css`
    :host {
      display: block;
    }

    .hero-banner {
      background-color: var(--surface2);
      padding: var(--sp-lg);
      margin-bottom: var(--sp-lg);
      border-radius: var(--r);
    }

    .checklist-row {
      display: flex;
      gap: var(--sp-md);
      background-color: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--r);
      padding: var(--sp-md);
      margin-bottom: var(--sp-sm);
    }

    .checklist-row input {
      margin-top: auto;
      margin-bottom: auto;
    }
  `;

  render() {
    // Mock active module ID
    const activeModuleId = 'superhuman-routine';
    
    // Mock module items
    const moduleItems = [
      { id: 'item-1', title: 'Morning Routine Setup' },
      { id: 'item-2', title: 'Mindfulness Meditation' },
      { id: 'item-3', title: 'Physical Exercise' },
      { id: 'item-4', title: 'Knowledge Acquisition' },
      { id: 'item-5', title: 'Evening Reflection' }
    ];

    return html`
      <div>
        <button @click="${this._backToHome}" style="margin-bottom: var(--sp-md);">
          ← Back to Dashboard
        </button>
        
        <div class="hero-banner">
          <h2>Module: ${activeModuleId}</h2>
          <p>Complete the following tasks to progress</p>
        </div>
        
        <div>
          ${moduleItems.map(item => html`
            <div class="checklist-row">
              <input 
                type="checkbox" 
                ?checked="${this.syncController.completions[item.id]}"
                @change="${(e: Event) => this._handleCheckToggle(e, item.id)}"
              >
              <span>${item.title}</span>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _handleCheckToggle(e: Event, itemId: string) {
    const checkbox = e.target as HTMLInputElement;
    // In a real implementation, we would call the sync controller
    // For now, we'll just log it
    console.log(`Toggling completion for item: ${itemId}, checked: ${checkbox.checked}`);
  }

  private _backToHome() {
    navigateTo('home');
  }
}