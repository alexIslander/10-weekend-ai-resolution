# 01-lit-starter

Standalone Lit (`lit-html`) starter built with Vite. This implementation follows `docs/plan.md` and uses a plain controller class with `render(..., { host: this })` instead of `LitElement`.

## Requirements

- Node.js 20+
- npm 10+

## Install

```bash
npm install
```

## Run locally

```bash
npm run dev
```

Open the printed local URL (typically `http://localhost:5173`).

## Test

```bash
npm run test
```

For watch mode:

```bash
npm run test:watch
```

## Production build

```bash
npm run build
npm run start
```

`npm run build` outputs static assets to `dist/`.

## Deploy to Cloudflare Pages (static upload)

1. Build production assets:

```bash
npm run build
```

2. In Cloudflare dashboard, go to `Workers & Pages` -> `Create` -> `Pages` -> `Upload assets`.
3. Upload the `dist/` directory from this project.
4. Set build command to none for direct uploads (assets are prebuilt).
5. Deploy and validate routes:
- `/`
- `/about`
- `/list`

Note: This app uses client-side navigation with `history.pushState`. For direct deep-link refresh support (`/about`, `/list`), configure Cloudflare Pages fallback to `index.html`.

Detailed guide: `docs/deploy-cloudflare-pages.md`

## Files

- `src/app-controller.js`: app state, update loop, navigation interception.
- `src/templates/app.js`: standalone Lit templates and directives.
- `vite.config.js`: production optimization and vendor chunking.
- `tests/`: Vitest coverage for core behavior.
- `docs/task-list.md`: implementation progress tracker.
- `docs/deploy-cloudflare-pages.md`: static upload deployment runbook.
