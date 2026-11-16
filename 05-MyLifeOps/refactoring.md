# MyLifeOps: Production-Grade Lit & Supabase Architecture Blueprint

This document translates the MyLifeOps monolithic wireframe prototype into an enterprise-ready, scalable architecture using **Lit (v3)**, **TypeScript**, and **Supabase**. It strictly adheres to the architectural paradigms, reactive state lifecycles, and component communication guardrails outlined in your knowledge base.

---

## 📂 1. Targeted File Architecture

This clean layout isolates configuration parameters, global state tracking mechanisms, state synchronization systems, and structural view layers.

```text
mylifeops/
├── index.html                # Single page entry hosting <mlo-app></mlo-app>
├── vite.config.ts            # Vite config optimized for Lit compiler options
├── package.json              # System configuration dependencies
└── src/
    ├── css/
    │   └── tokens.css        # Global CSS variables & layout design tokens
    ├── state/
    │   └── global-store.ts   # Core Signal framework tracking system routes & sessions
    ├── controllers/
    │   └── supabase-sync.ts  # Database Reactive Controller (Auth, Mutations, Sync)
    ├── models/
    │   └── types.ts          # Core data models (User, Module, Completion, Streak)
    └── components/
        ├── mlo-app.ts        # Dynamic layout viewport orchestrating subcomponents
        ├── mlo-dashboard.ts  # Core dashboard panel (Progress metrics & Grid cards)
        ├── mlo-module.ts     # Flexible interactive module checklist renderer
        └── shared/
            ├── progress-ring.ts
            └── metric-card.ts

```

---

## 🛠️ 2. Dependencies & Tooling Build System

### `package.json`

```json
{
  "name": "mylifeops-lit-app",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@lit-labs/signals": "^0.1.1",
    "@supabase/supabase-js": "^2.39.0",
    "lit": "^3.1.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}

```

### `vite.config.ts`

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: true
  }
});

```

---

## 🚦 3. Shared Global Architecture (ECMAScript Signals)

To optimize structural performance, manage navigation matrices and credential assignments via isolated signals. This eliminates prop-drilling across the app layout tree.

```typescript
// src/state/global-store.ts
import { signal } from '@lit-labs/signals';
import type { User } from '@supabase/supabase-js';

// Centralized navigation and contextual view matrices
export const currentViewSignal = signal<'home' | 'module-detail' | 'settings'>('home');
export const activeModuleIdSignal = signal<string | null>(null);

// Global operational session configuration tracking
export const currentUserSignal = signal<User | null>(null);

export function navigateTo(view: 'home' | 'module-detail' | 'settings', moduleId: string | null = null) {
  activeModuleIdSignal.set(moduleId);
  currentViewSignal.set(view);
}

```

---

## 🔌 4. The Database Synchronizer (Reactive Controller)

This decoupled operational engine handles transactions between your frontend elements and the Supabase backend. It uses optimistic updates for rapid UI changes and features an integrated event dispatcher hook.

```typescript
// src/controllers/supabase-sync.ts
import { ReactiveController, ReactiveControllerHost } from 'lit';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { currentUserSignal } from '../state/global-store';
import type { UserProfile, CompletionMap } from '../models/types';

const SUPABASE_URL = "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

export class SupabaseSyncController implements ReactiveController {
  private host: ReactiveControllerHost;
  public client: SupabaseClient;
  
  // Internal Reactive Variables matching data definitions
  public profile: UserProfile | null = null;
  public completions: CompletionMap = {};

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    this.host.addController(this);
    this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  hostConnected() {
    // Synchronize global platform access changes
    this.client.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      currentUserSignal.set(user);
      
      if (user) {
        await this.syncUserData(user.id);
      } else {
        this.profile = null;
        this.completions = {};
      }
      this.host.requestUpdate();
    });
  }

  hostDisconnected() {
    // Teardown connections or persistent real-time subscriptions here if necessary
  }

  private async syncUserData(userId: string) {
    try {
      const [profileResponse, completionsResponse] = await Promise.all([
        this.client.from('user_profiles').select('*').eq('id', userId).single(),
        this.client.from('daily_completions').select('custom_item_key, item_id')
      ]);

      if (profileResponse.data) {
        this.profile = profileResponse.data as UserProfile;
      }

      if (completionsResponse.data) {
        // Fast boolean lookup map conversion
        this.completions = completionsResponse.data.reduce((acc, current) => {
          acc[current.custom_item_key] = true;
          return acc;
        }, {} as CompletionMap);
      }
    } catch (error) {
      console.error('Data synchronization process aborted:', error);
    } finally {
      this.host.requestUpdate();
    }
  }

  public async toggleCompletion(key: string, itemId?: string): Promise<void> {
    const user = currentUserSignal.get();
    if (!user) return;

    const activelyCompleted = !!this.completions[key];

    if (!activelyCompleted) {
      // 1. Optimistic Update UI Step
      this.completions = { ...this.completions, [key]: true };
      if (this.profile) this.profile.total_xp += 10;
      this.host.requestUpdate();

      // 2. Persistent API Save Block
      const { error } = await this.client
        .from('daily_completions')
        .insert([{ user_id: user.id, custom_item_key: key, item_id: itemId }]);

      if (error) {
        // Rollback on database failure
        delete this.completions[key];
        if (this.profile) this.profile.total_xp -= 10;
        this.host.requestUpdate();
      }
    } else {
      // 1. Optimistic Update UI Step
      const updatedCompletions = { ...this.completions };
      delete updatedCompletions[key];
      this.completions = updatedCompletions;
      if (this.profile) this.profile.total_xp = Math.max(0, this.profile.total_xp - 10);
      this.host.requestUpdate();

      // 2. Persistent API Delete Transaction
      const { error } = await this.client
        .from('daily_completions')
        .delete()
        .eq('user_id', user.id)
        .eq('custom_item_key', key);

      if (error) {
        // Rollback deletion error
        this.completions = { ...this.completions, [key]: true };
        if (this.profile) this.profile.total_xp += 10;
        this.host.requestUpdate();
      }
    }
  }
}

```

---

## 🧱 5. Modular View Layer Implementation

### Core View Container Frame (`src/components/mlo-app.ts`)

This root component acts as the main shell framework, orchestrating layouts, routing states via signals, and protecting client-only references for Server-Side Rendering (SSR) safety.

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { currentViewSignal, currentUserSignal } from '../state/global-store';
import { SupabaseSyncController } from '../controllers/supabase-sync';

// Dynamic sub-rendering view components definitions
import './mlo-dashboard';
import './mlo-module';

@customElement('mlo-app')
export class MloApp extends SignalWatcher(LitElement) {
  private db = new SupabaseSyncController(this);

  @state() private _isDark: boolean = false;

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background-color: var(--bg);
      color: var(--text);
      font-family: 'DM Sans', sans-serif;
      transition: background-color var(--tr), color var(--tr);
    }
    .layout-wrapper {
      display: flex;
    }
    main {
      flex-grow: 1;
      padding: 24px;
    }
  `;

  constructor() {
    super();
    // Default fallback assignment completely clean for SSR passes
  }

  connectedCallback() {
    super.connectedCallback();
    // Safeguard evaluation checking for client execution environment
    if (typeof window !== 'undefined') {
      this._isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setAttribute('data-dark', this._isDark ? '' : 'false');
    }
  }

  render() {
    const authenticatedUser = currentUserSignal.get();

    if (!authenticatedUser) {
      return html`
        <div class="auth-gate-fallback">
          <h1>MyLifeOps</h1>
          <button @click=${this._handleLogin}>Authenticate via Magic Link</button>
        </div>
      `;
    }

    return html`
      <div class="layout-wrapper">
        <nav class="sidebar">
          <h3>MyLifeOps</h3>
          <button @click=${() => currentViewSignal.set('home')}>Dashboard</button>
        </nav>
        
        <main>
          ${this._renderActiveViewport()}
        </main>
      </div>
    `;
  }

  private _renderActiveViewport() {
    const activeRoute = currentViewSignal.get();

    switch (activeRoute) {
      case 'home':
        return html`<mlo-dashboard .syncController=${this.db}></mlo-dashboard>`;
      case 'module-detail':
        return html`<mlo-module .syncController=${this.db}></mlo-module>`;
      default:
        return html`<div>Resource element routing context exception.</div>`;
    }
  }

  private _handleLogin() {
    this.db.client.auth.signInWithOtp({ email: 'operator@mylifeops.io' });
  }
}

```

### Dashboard Panel Grid (`src/components/mlo-dashboard.ts`)

This component renders user progress metrics, tracks overall status, and fires modular routing commands back up through the shared signal architecture.

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { navigateTo } from '../state/global-store';
import type { SupabaseSyncController } from '../controllers/supabase-sync';

@customElement('mlo-dashboard')
export class MloDashboard extends SignalWatcher(LitElement) {
  @property({ type: Object }) 
  public syncController!: SupabaseSyncController;

  static styles = css`
    :host { display: block; }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .metric-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--r);
      padding: 20px;
    }
    .module-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }
    .module-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--r);
      padding: 16px;
      cursor: pointer;
    }
  `;

  render() {
    const profile = this.syncController.profile;
    const currentXp = profile?.total_xp ?? 0;
    const computedLevel = Math.floor(currentXp / 2000) + 1;

    return html`
      <header>
        <h2>Good Morning, Operator</h2>
        <p>System operational status check solid.</p>
      </header>

      <div class="metrics-grid">
        <div class="metric-card">
          <h4>Total Structural XP</h4>
          <p>${currentXp} Points</p>
        </div>
        <div class="metric-card">
          <h4>Calculated Operations Level</h4>
          <p>Level ${computedLevel}</p>
        </div>
      </div>

      <h3>Functional Execution Domains</h3>
      <div class="module-list">
        <div class="module-card" @click=${() => this._triggerRoute('superhuman')}>
          <h4>🧠 Superhuman Routine</h4>
          <p>Check ongoing operational readiness metrics.</p>
        </div>
        <div class="module-card" @click=${() => this._triggerRoute('cooking')}>
          <h4>🍚 Culinary Operations</h4>
          <p>Meal preparation logs and schedules.</p>
        </div>
      </div>
    `;
  }

  private _triggerRoute(moduleId: string) {
    navigateTo('module-detail', moduleId);
  }
}

```

### Dynamic Module Layout Framework (`src/components/mlo-module.ts`)

This panel uses the precise binding prefixes from the knowledge base: **`?checked`** for boolean evaluation states and explicit **`.property`** references down across nested target components.

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { activeModuleIdSignal, navigateTo } from '../state/global-store';
import type { SupabaseSyncController } from '../controllers/supabase-sync';

@customElement('mlo-module')
export class MloModule extends SignalWatcher(LitElement) {
  @property({ type: Object })
  public syncController!: SupabaseSyncController;

  static styles = css`
    :host { display: block; }
    .hero-banner {
      background: var(--surface2);
      border-radius: var(--r);
      padding: 32px;
      margin-bottom: 24px;
    }
    .checklist-row {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--surface);
      padding: 14px;
      border-radius: var(--rsm);
      margin-bottom: 8px;
      border: 1px solid var(--border2);
    }
  `;

  render() {
    const activeModuleId = activeModuleIdSignal.get();
    
    return html`
      <button @click=${this._backToHome}>← Return to Ops Control</button>

      <div class="hero-banner">
        <h2>Domain Module Matrix Configuration: ${activeModuleId}</h2>
        <p>Interactive tracking checkpoint updates pass automatically into global telemetry maps.</p>
      </div>

      <div class="checklist-container">
        <div class="checklist-row">
          <input 
            type="checkbox" 
            id="habit_hydration"
            ?checked=${this.syncController.completions['habit_hydration']}
            @change=${this._handleCheckToggle}
          />
          <label for="habit_hydration">Hydrate: Hydration checkpoint metrics met</label>
        </div>

        <div class="checklist-row">
          <input 
            type="checkbox" 
            id="habit_meditation"
            ?checked=${this.syncController.completions['habit_meditation']}
            @change=${this._handleCheckToggle}
          />
          <label for="habit_meditation">Calibrate: Mental focus exercise log clear</label>
        </div>
      </div>
    `;
  }

  private _handleCheckToggle(e: Event) {
    const element = e.target as HTMLInputElement;
    const internalKey = element.id;
    this.syncController.toggleCompletion(internalKey);
  }

  private _backToHome() {
    navigateTo('home');
  }
}

```

---

## 🔒 6. Strict Implementation Guardrails Audit

Before preparing files for deployment to **Cloudflare Pages via Vite compilation tasks**, verify that these architectural guidelines are completely satisfied:

1. **DOM Scoping Encapsulation:** No component files evaluate `document.querySelector()` for sub-node updates. Use standard internal event handlers or structural `@query` decorator queries within the element layout boundaries.
2. **Immutability Array Updates:** If managing local structural list shifts, use object spreading models (`this.completions = { ...this.completions }`) to reliably trigger Lit's shallow equality check loop.
3. **Pure Rendering Passes:** No processing step maps parameter variable transformations or database actions directly within the body of a `render()` statement block.
4. **Boolean Variable Protections:** Element attributes like checked, disabled, hidden, or selected must use the `?` character notation to prevent standard element string evaluation issues.
5. **Universal Component Shell Alignment:** Every component definition extending structural capabilities must pass inherited execution arguments by executing `super.connectedCallback()` and `super.disconnectedCallback()` right at initialization.