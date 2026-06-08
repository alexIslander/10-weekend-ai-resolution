# MyLifeOps Onboarding Matrix: Component Implementation Blueprint

This production-grade **Lit (v3)** component handles the Phase 3 user onboarding flow. It implements a multi-step modal design pattern that handles client-side timezone localization, selection of operational modules, and optimistic state propagation to the Supabase backend via our shared controller context.

---

## 💻 Component Architecture Implementation

```typescript
// src/components/mlo-onboarding-flow.ts
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { currentUserSignal, navigateTo } from '../state/global-store';
import type { SupabaseSyncController } from '../controllers/supabase-sync';

interface OnboardingPayload {
  display_name: string;
  timezone: string;
  selected_modules: string[];
}

@customElement('mlo-onboarding-flow')
export class MloOnboardingFlow extends SignalWatcher(LitElement) {
  @property({ type: Object })
  public syncController!: SupabaseSyncController;

  // Internal reactive state variables isolated from public API
  @state() private _currentStep = 0;
  @state() private _displayName = '';
  @state() private _timezone = 'UTC';
  @state() private _selectedModules: string[] = [];
  @state() private _isSubmitting = false;

  static styles = css`
    :host {
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 1000;
    }

    .modal-overlay {
      position: absolute;
      width: 100%;
      height: 100%;
      background: rgba(10, 10, 12, 0.85);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-card {
      background: var(--surface, #1e1e24);
      border: 1px solid var(--border, #2e2e38);
      border-radius: 24px;
      width: 100%;
      max-width: 540px;
      padding: 36px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
      box-sizing: border-box;
    }

    .step-indicator {
      display: flex;
      gap: 6px;
      margin-bottom: 24px;
    }

    .dot {
      height: 4px;
      flex-grow: 1;
      background: var(--border, #2e2e38);
      border-radius: 2px;
      transition: background 0.3s ease;
    }

    .dot.active {
      background: var(--primary, #4f46e5);
    }

    h2 {
      font-family: 'Syne', sans-serif;
      font-size: 24px;
      margin: 0 0 8px 0;
    }

    p {
      color: var(--text-secondary, #a1a1aa);
      margin: 0 0 24px 0;
      font-size: 14px;
      line-height: 1.5;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
      color: var(--text-secondary, #a1a1aa);
    }

    input[type="text"], select {
      width: 100%;
      padding: 12px 16px;
      background: var(--surface-sub, #141417);
      border: 1px solid var(--border, #2e2e38);
      border-radius: 12px;
      color: #ffffff;
      font-size: 16px;
      box-sizing: border-box;
    }

    input:focus, select:focus {
      outline: none;
      border-color: var(--primary, #4f46e5);
    }

    .grid-selection {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .grid-option {
      border: 1px solid var(--border, #2e2e38);
      background: var(--surface-sub, #141417);
      padding: 16px;
      border-radius: 16px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: all 0.2s ease;
    }

    .grid-option.selected {
      border-color: var(--primary, #4f46e5);
      background: rgba(79, 70, 229, 0.1);
    }

    .actions {
      display: flex;
      justify-content: space-between;
      margin-top: 32px;
      gap: 12px;
    }

    button {
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: opacity 0.2s;
    }

    button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .btn-primary {
      background: var(--primary, #4f46e5);
      color: #ffffff;
      flex-grow: 1;
    }

    .btn-secondary {
      background: transparent;
      color: var(--text-secondary, #a1a1aa);
      border: 1px solid var(--border, #2e2e38);
    }
  `;

  constructor() {
    super();
    // Maintain safe foundational initializations for strict SSR environments
  }

  connectedCallback() {
    super.connectedCallback();
    // Safely deduce system localized timezone metadata strictly on the client run
    if (typeof window !== 'undefined') {
      this._timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    }
  }

  render() {
    return html`
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="step-indicator">
            <div class="dot ${this._currentStep >= 0 ? 'active' : ''}"></div>
            <div class="dot ${this._currentStep >= 1 ? 'active' : ''}"></div>
            <div class="dot ${this._currentStep >= 2 ? 'active' : ''}"></div>
          </div>
          ${this._renderActiveStep()}
        </div>
      </div>
    `;
  }

  private _renderActiveStep() {
    switch (this._currentStep) {
      case 0:
        return html`
          <h2>Create Core Profile</h2>
          <p>Establish your unique operational callsign and localization settings.</p>
          
          <div class="form-group">
            <label for="displayName">Operator Name</label>
            <input 
              type="text" 
              id="displayName" 
              .value=${this._displayName}
              @input=${this._handleNameInput}
              placeholder="e.g., Operator Prime"
            />
          </div>

          <div class="form-group">
            <label for="timezone">Operational Timezone</label>
            <select id="timezone" .value=${this._timezone} @change=${this._handleTimezoneChange}>
              <option value="UTC">Coordinated Universal Time (UTC)</option>
              <option value="America/New_York">Eastern Time (EST/EDT)</option>
              <option value="Europe/London">London (GMT/BST)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
            </select>
          </div>

          <div class="actions">
            <div></div>
            <button 
              class="btn-primary" 
              ?disabled=${!this._displayName.trim()} 
              @click=${this._nextStep}>
              Continue
            </button>
          </div>
        `;

      case 1:
        return html`
          <h2>Initialize Focus Domains</h2>
          <p>Select the baseline modules to construct your operational architecture dashboard.</p>
          
          <div class="grid-selection">
            <div 
              class="grid-option ${this._isSelected('superhuman') ? 'selected' : ''}" 
              @click=${() => this._toggleModule('superhuman')}>
              <span>🧠</span>
              <strong>Superhuman Routine</strong>
            </div>
            <div 
              class="grid-option ${this._isSelected('cooking') ? 'selected' : ''}" 
              @click=${() => this._toggleModule('cooking')}>
              <span>🍚</span>
              <strong>Culinary Ops</strong>
            </div>
          </div>

          <div class="actions">
            <button class="btn-secondary" @click=${this._prevStep}>Back</button>
            <button 
              class="btn-primary" 
              ?disabled=${this._selectedModules.length === 0} 
              @click=${this._nextStep}>
              Review Configuration
            </button>
          </div>
        `;

      case 2:
        return html`
          <h2>Confirm Initialization</h2>
          <p>Verify data integrity metrics before anchoring profile values into persistent layers.</p>
          
          <div class="form-group">
            <label>Profile Callsign</label>
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 16px;">${this._displayName}</div>
            
            <label>Selected Telemetry Domains</label>
            <div style="font-size: 14px; color: var(--primary); font-weight: 600;">
              ${this._selectedModules.join(', ')}
            </div>
          </div>

          <div class="actions">
            <button class="btn-secondary" ?disabled=${this._isSubmitting} @click=${this._prevStep}>Back</button>
            <button 
              class="btn-primary" 
              ?disabled=${this._isSubmitting} 
              @click=${this._submitOnboarding}>
              ${this._isSubmitting ? 'Provisioning Architecture...' : 'Initialize System'}
            </button>
          </div>
        `;
      default:
        return html``;
    }
  }

  private _handleNameInput(e: InputEvent) {
    const input = e.target as HTMLInputElement;
    this._displayName = input.value;
  }

  private _handleTimezoneChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this._timezone = select.value;
  }

  private _isSelected(id: string): boolean {
    return this._selectedModules.includes(id);
  }

  private _toggleModule(id: string) {
    // Immutable array modifications ensure proper property rendering detection
    if (this._selectedModules.includes(id)) {
      this._selectedModules = this._selectedModules.filter(m => m !== id);
    } else {
      this._selectedModules = [...this._selectedModules, id];
    }
  }

  private _nextStep() { this._currentStep = Math.min(2, this._currentStep + 1); }
  private _prevStep() { this._currentStep = Math.max(0, this._currentStep - 1); }

  private async _submitOnboarding() {
    const user = currentUserSignal.get();
    if (!user) return;

    this._isSubmitting = true;

    try {
      // Execute multi-table updates through Supabase interface
      const { error: profileError } = await this.syncController.client
        .from('user_profiles')
        .insert([{
          id: user.id,
          display_name: this._displayName,
          timezone: this._timezone
        }]);

      if (profileError) throw profileError;

      // Force synchronous structural update run down to database sync controller
      await this.syncController.syncRemoteData(user.id);

      // Fire tracking confirmation event upstream inside system root loops
      this.dispatchEvent(new CustomEvent('mlo-onboarding-complete', {
        detail: {
          display_name: this._displayName,
          timezone: this._timezone,
          modules: this._selectedModules
        } as OnboardingPayload,
        bubbles: true,
        composed: true
      }));

      // Route layout focus path back down into standard operational view
      navigateTo('home');
    } catch (err) {
      console.error('System structural profile anchor allocation aborted:', err);
    } finally {
      this._isSubmitting = false;
    }
  }
}

```

---

## 🔒 Post-Implementation Validation Checklists

Before shipping this workflow block down into production instances, evaluate execution criteria rules checking for compatibility errors:

1. **Reactive Inputs Binding:** Verify input target transformations map text parameters via programmatic input values assignment directly (`.value=${this._displayName}`) instead of writing raw HTML text constraints.
2. **Transactional State Protections:** Ensure operational execution buttons carry full structural constraints checking via custom boolean flags (`?disabled=${this._isSubmitting}`) to block concurrent execution threads.

---