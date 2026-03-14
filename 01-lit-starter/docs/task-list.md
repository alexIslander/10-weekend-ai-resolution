# Implementation task list

- [x] Scaffold Vite + Lit standalone project files.
- [x] Implement app controller with router-less navigation and render host binding.
- [x] Implement standalone templates with `repeat` and `until` directives.
- [x] Add production-focused Vite config and chunking strategy.
- [x] Add automated tests for routing, host event scope, and async template rendering.
- [x] Verify `npm run dev`, `npm run build`, and `npm run test` in a fully installed environment.
- [x] Document Cloudflare Pages static deployment steps and validation checklist.

## Branch completion follow-up

- [x] Update workspace documentation so `01-lit-starter` is listed as an implemented project.
- [x] Update repository contributor guidance with `01-lit-starter` commands and test setup.
- [x] Expand routing tests to cover delegated anchor navigation and `popstate` handling.
- [x] Add GitHub Actions workflows for `01-lit-starter` CI and Cloudflare Pages deployment.
- [x] Add a static SPA fallback asset for Cloudflare Pages deep links.

## Progress log

- 2026-02-08: Implemented app scaffold and standalone Lit render loop.
- 2026-02-08: Added Vitest coverage for routing, host event scope, and async rendering.
- 2026-02-08: Verified `npm run test`, `npm run build`, and `npm run dev` (startup check on `127.0.0.1:4173`).
- 2026-03-14: Updated repo docs, added explicit routing coverage, and added GitHub Actions for CI and Pages deploys.
