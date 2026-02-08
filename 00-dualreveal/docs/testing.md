# Testing

## Prerequisites
- `npm install`
- A running Supabase project is optional; tests can run against the in-memory store.

## Run Playwright tests
- `npm run test`
- `npm run test:e2e`

Playwright starts the dev server automatically and targets `http://localhost:3000`.

## Useful flags
- Headed mode: `npx playwright test --headed`
- Trace on failure: `npx playwright test --trace retain-on-failure`
- Always record trace: `npx playwright test --trace on`
- Video on: `npx playwright test --video on`
- Screenshots on: `npx playwright test --screenshot on`

## Artifacts
- Artifacts are stored in `test-results` when enabled.
- View a trace with `npx playwright show-trace test-results/<test-name>/trace.zip`.
- Play a video with `open test-results/<test-name>/video.webm`.
