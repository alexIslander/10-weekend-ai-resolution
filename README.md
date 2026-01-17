# DualReveal

Private, guided quiz flow for couples. One partner purchases, the other answers
once, and the purchaser receives a formatted reveal.

## Local development
- `npm install`
- Copy `.env.example` to `.env.local` and fill in Supabase keys if available.

## Documentation
- `docs/developer-setup.md`
- `docs/testing.md`

## Scripts
- `npm run dev` starts the Next.js dev server.
- `npm run build` builds the production bundle.
- `npm run start` runs the production server.
- `npm run test` runs Playwright end-to-end tests.

## Notes
- The app falls back to an in-memory store when Supabase is not configured.
- Payments are stubbed and will be wired later.
