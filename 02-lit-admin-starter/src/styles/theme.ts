import { css } from 'lit'

export const themeStyles = css`
  :host {
    /* Light theme (default) */
    --bg: #f8fafc;
    --bg-card: #ffffff;
    --bg-sidebar: #f1f5f9;
    --bg-sidebar-hover: #e2e8f0;
    --bg-input: #f1f5f9;
    --bg-overlay: rgba(15, 23, 42, 0.5);

    --fg: #0f172a;
    --fg-muted: #64748b;
    --fg-subtle: #94a3b8;
    --fg-invert: #ffffff;

    --border: #e2e8f0;
    --border-subtle: #f1f5f9;

    --accent: #14b8a6;
    --accent-hover: #0d9488;
    --accent-subtle: rgba(20, 184, 166, 0.1);

    --success: #22c55e;
    --success-bg: rgba(34, 197, 94, 0.1);
    --warning: #f59e0b;
    --warning-bg: rgba(245, 158, 11, 0.1);
    --danger: #ef4444;
    --danger-bg: rgba(239, 68, 68, 0.1);
    --info: #3b82f6;
    --info-bg: rgba(59, 130, 246, 0.1);

    --radius-sm: 6px;
    --radius: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;

    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
    --shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04);

    --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
    --font-mono: 'JetBrains Mono', ui-monospace, monospace;

    --transition: 200ms cubic-bezier(0.4, 0, 0.2, 1);

    font-family: var(--font-sans);
    color: var(--fg);
  }

  :host([theme="dark"]) {
    --bg: #0c0f1a;
    --bg-card: #141827;
    --bg-sidebar: #101320;
    --bg-sidebar-hover: #1a1f35;
    --bg-input: #1a1f35;
    --bg-overlay: rgba(0, 0, 0, 0.6);

    --fg: #e2e8f0;
    --fg-muted: #94a3b8;
    --fg-subtle: #64748b;
    --fg-invert: #0f172a;

    --border: #1e293b;
    --border-subtle: #1a1f35;

    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.2);
    --shadow: 0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2);
  }
`

export const resetStyles = css`
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  :host {
    display: block;
  }
`
