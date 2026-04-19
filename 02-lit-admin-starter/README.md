# 02-lit-admin-starter

Standalone Lit admin dashboard starter built with Vite and Vitest.

This project is opinionated toward a small web-components admin baseline rather than a generic
component gallery. It keeps the shell and styling in shared components while feature modules can
follow a `boundary` + `control` + `entity` split.

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

Open the printed local URL, typically `http://localhost:5173`.

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

## Files

- `src/main.ts`: Lit entrypoint and custom element registration.
- `src/app/navigation.ts`: shared page metadata and navigation IDs.
- `src/components/`: dashboard shell and presentational Lit elements.
- `src/features/`: feature boundaries and BCE-style modules.
- `src/styles/theme.ts`: shared theme tokens and reset styles.
- `tests/`: Vitest coverage for the app shell.
- `docs/task-list.md`: implementation progress tracker.
