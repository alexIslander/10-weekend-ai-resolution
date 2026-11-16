# Production-Ready Patch: Slicing the Monolith with Lit & Supabase

While a single-file vanilla script approach is fantastic for rapid prototyping and validation, scaling an application like **MyLifeOps** requires a structured front-end architecture. Transitioning to **Lit (v3)** paired with **Supabase** turns your procedural prototype into an optimized component system.

Instead of mutating global objects and manually forcing raw DOM refreshes using string-based modifications, this patched architecture uses **Reactive Controllers** for data layers, **ECMAScript Signals** for reactive cross-component synchronization, and strict **Shadow DOM scoping** to isolate views cleanly.

---

## 🛠️ Step 1: Core Relational Database Schema & Policies

The relational database architecture requires no structural modification, as Postgres tables exist independently of the front-end rendering layer. Execute this script within your Supabase SQL Editor to initialize the schema, relational indices, and **Row-Level Security (RLS)** constraints.

```sql
-- Enable UUID generation extension
create extension if not exists "uuid-ossp";

-- 1. USER PROFILES (Linked to Supabase Auth)
create table public.user_profiles (
    id uuid references auth.users on delete cascade primary key,
    display_name text not null,
    avatar_url text,
    timezone text default 'UTC',
    total_xp integer default 1240, -- Initialized with your wireframe defaults
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. MODULES (The 9 Content Areas)
create table public.modules (
    id text primary key, -- e.g., 'superhuman', 'cooking'
    emoji text not null,
    name text not null,
    color text not null,
    description text not null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 3. CHECKLIST ITEMS (Seeded data per module configuration)
create table public.checklist_items (
    id uuid default gen_random_uuid() primary key,
    module_id text references public.modules(id) on delete cascade not null,
    section_title text not null, -- e.g., '🌅 Morning', '🍚 Rice'
    item_text text not null,
    display_order integer not null
);

-- 4. DAILY COMPLETIONS (Atomic user interactions)
create table public.daily_completions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.user_profiles(id) on delete cascade not null,
    item_id uuid references public.checklist_items(id) on delete cascade,
    custom_item_key text not null, -- e.g., 'superhuman_Morning_0'
    completed_at timestamptz default timezone('utc'::text, now()) not null
);

-- 🔓 ROW LEVEL SECURITY (RLS) POLICIES
alter table public.user_profiles enable row level security;
alter table public.daily_completions enable row level security;

create policy "Users can modify their own profile data" 
    on public.user_profiles for all using (auth.uid() = id);

create policy "Users can operate on their own completion metrics" 
    on public.daily_completions for all using (auth.uid() = user_id);

-- Read-only parameters for global content tables
alter table public.modules enable row level security;
alter table public.checklist_items enable row level security;
create policy "Public modules are globally readable" on public.modules for select using (true);
create policy "Public items are globally readable" on public.checklist_items for select using (true);

```

---

## ⚡ Step 2: Supabase Native Engagement (The XP Automator)

To prevent client-side intercept mutations, calculations are isolated directly within the database layer using an automated **PostgreSQL Trigger**. Whenever a completion record is inserted or deleted, the user profile updates safely.

```sql
create or replace function public.handle_completion_xp()
returns trigger as $$
begin
    if (TG_OP = 'INSERT') then
        update public.user_profiles
        set total_xp = total_xp + 10
        where id = new.user_id;
        return new;
    elsif (TG_OP = 'DELETE') then
        update public.user_profiles
        set total_xp = greatest(0, total_xp - 10)
        where id = old.user_id;
        return old;
    end if;
end;
$$ language plpgsql security definer;

create trigger on_habit_mutation
    after insert or delete on public.daily_completions
    for each row execute function public.handle_completion_xp();

```

---

## 🔌 Step 3: Refactoring State management into a Reactive Controller

Instead of polluting your element structure with raw fetch methods, we isolate the backend interaction into an encapsulated **Lit Reactive Controller**. This implementation manages state transitions, provides optimistic updates for rapid UI changes, and hooks into the host element lifecycle seamlessly.

```typescript
// src/controllers/supabase-sync.ts
import { ReactiveController, ReactiveControllerHost } from 'lit';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { signal } from '@lit-labs/signals';

const SUPABASE_URL = "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

// Global signals for decoupled architectural cross-communication
export const activeViewSignal = signal<'home' | 'module' | 'streaks'>('home');
export const activeModuleIdSignal = signal<string | null>(null);

export class SupabaseSyncController implements ReactiveController {
  private host: ReactiveControllerHost;
  public client: SupabaseClient;
  
  public profile = { total_xp: 1240, level: 7 }; // Wireframe fallback states
  public checks: Record<string, boolean> = {};

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    this.host.addController(this);
    this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  hostConnected() {
    this.client.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await this.syncRemoteData(session.user.id);
      }
      this.host.requestUpdate();
    });
  }

  async syncRemoteData(userId: string) {
    const [profileData, completionData] = await Promise.all([
      this.client.from('user_profiles').select('*').eq('id', userId).single(),
      this.client.from('daily_completions').select('custom_item_key')
    ]);

    if (profileData.data) this.profile = profileData.data;
    
    if (completionData.data) {
      this.checks = completionData.data.reduce((acc, row) => {
        acc[row.custom_item_key] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }
    this.host.requestUpdate();
  }

  async toggleCheck(key: string, itemId?: string) {
    const sessionUser = (await this.client.auth.getUser()).data.user;
    if (!sessionUser) return;

    const wasChecked = !!this.checks[key];

    // Optimistic Immutability Update Pattern
    if (!wasChecked) {
      this.checks = { ...this.checks, [key]: true };
      this.profile = { ...this.profile, total_xp: this.profile.total_xp + 10 };
      this.host.requestUpdate();

      const { error } = await this.client
        .from('daily_completions')
        .insert([{ user_id: sessionUser.id, custom_item_key: key, item_id: itemId }]);

      if (error) this._rollbackToggle(key, -10);
    } else {
      const updatedChecks = { ...this.checks };
      delete updatedChecks[key];
      this.checks = updatedChecks;
      this.profile = { ...this.profile, total_xp: Math.max(0, this.profile.total_xp - 10) };
      this.host.requestUpdate();

      const { error } = await this.client
        .from('daily_completions')
        .delete()
        .eq('user_id', sessionUser.id)
        .eq('custom_item_key', key);

      if (error) this._rollbackToggle(key, 10);
    }
  }

  private _rollbackToggle(key: string, xpAdjustment: number) {
    this.checks = { ...this.checks, [key]: !this.checks[key] };
    this.profile = { ...this.profile, total_xp: this.profile.total_xp + xpAdjustment };
    this.host.requestUpdate();
    this.host.dispatchEvent(new CustomEvent('toast-alert', { 
      detail: 'Sync error encountered. Reverting.', 
      bubbles: true, 
      composed: true 
    }));
  }
}

```

---

## 🧱 Step 4: Transforming the Wireframe View into a Custom Element

This rewritten view leverages standard TypeScript decorators, uses the **Boolean Attribute Directive (`?`)** to completely avoid the boolean evaluation trap, and processes structural custom styling inside an isolated Shadow DOM container.

```typescript
// src/components/mlo-module-view.ts
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { SupabaseSyncController, activeViewSignal } from '../controllers/supabase-sync';
import { MODULES } from '../data/seeded-content'; // Transformed array asset from wireframe

@customElement('mlo-module-view')
export class MloModuleView extends SignalWatcher(LitElement) {
  // Direct controller instantiation
  private _db = new SupabaseSyncController(this);

  @property({ type: String }) 
  public moduleId = 'superhuman'; // Wireframe fallback anchor module

  static styles = css`
    :host {
      display: block;
      padding: 24px;
    }
    .chk-wrap {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 18px;
      margin-bottom: 13px;
      overflow: hidden;
    }
    .chk-hdr {
      padding: 14px 20px;
      font-family: 'Syne', sans-serif;
      font-size: 14px;
      font-weight: 700;
      background: var(--surface2);
      border-bottom: 1px solid var(--border);
    }
    .chk-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 11px 20px;
      cursor: pointer;
    }
    .chk-item:hover { background: var(--surface2); }
  `;

  render() {
    const moduleData = MODULES.find(m => m.id === this.moduleId);
    if (!moduleData) return html`<p>Target module profile error.</p>`;

    return html`
      <button class="back-btn" @click=${this._navigateBack}>← Back</button>
      
      <div class="hero-wrap">
        <div class="hero-ico">${moduleData.emoji}</div>
        <div class="hero-body">
          <div class="hero-title">${moduleData.name}</div>
          <div class="hero-desc">${moduleData.desc}</div>
        </div>
      </div>

      <div class="sections-container">
        ${moduleData.sections.map(section => html`
          <div class="chk-wrap">
            <div class="chk-hdr">${section.title}</div>
            ${section.items.map((item, index) => {
              const uniqueKey = `${this.moduleId}_${section.title}_${index}`;
              const isChecked = !!this._db.checks[uniqueKey];
              
              return html`
                <div class="chk-item">
                  <input 
                    type="checkbox" 
                    id=${uniqueKey}
                    ?checked=${isChecked}
                    @change=${() => this._handleItemToggle(uniqueKey)}
                  />
                  <label for=${uniqueKey}>${item}</label>
                </div>
              `;
            })}
          </div>
        `)}
      </div>
    `;
  }

  private _handleItemToggle(key: string) {
    this._db.toggleCheck(key);
  }

  private _navigateBack() {
    activeViewSignal.set('home');
  }
}

```

---

## 🚀 Step 5: Production Cloudflare Pages Build Workflow

Because compiled TypeScript decorators can't be computed natively by direct static processing headers, a minimal build environment using **Vite** configures your assets cleanly for global distribution.

### 1. Project Dependencies Configuration (`package.json`)

```json
{
  "name": "mylifeops-app",
  "private": true,
  "version": "3.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build"
  },
  "dependencies": {
    "@lit-labs/signals": "^0.1.1",
    "@supabase/supabase-js": "^2.39.0",
    "lit": "^3.1.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "vite": "^5.1.0"
  }
}

```

### 2. Environment Compilation Settings (`vite.config.ts`)

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'esnext',
    minify: 'terser',
    outDir: 'dist'
  }
});

```

### 3. Deployment Configuration

* **Target Output Path:** Change the Cloudflare Pages build configurations setting from your root directory (`/`) directly to pointing at your built target production output folder (`dist`).
* **Operational Command:** Change the step from an empty fallback value directly to triggering `npm run build` or `npx vite build`.

---

## 🔒 Lit Implementation Guardrails Validation Check

Before checking in your production deployment, audit your views against these core safety constraints:

* **Server-Side Rendering (SSR) Protections:** Ensure that global, window-specific APIs (`window.matchMedia` or `localStorage`) are entirely isolated away from basic constructor scripts. Wrap them securely inside the native `connectedCallback()` method lifecycle step alongside a structural block checking `typeof window !== 'undefined'`.
* **Zero Cross-Boundary DOM Lookups:** Ensure no elements perform procedural selector manipulations pointing at root-level objects (`document.querySelector`). Use internal decorators (`@query('#id')`) or localized property metrics targeting the component's internal `shadowRoot` structure instead.

---