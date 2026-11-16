# Repository Guidelines

## Project Structure & Module Organization
Top-level structure:
- `README.md`: workspace overview and project index.
- `AGENTS.md`: this file.
- `LICENSE`: licensing terms.
- `00-dualreveal/`, `01-lit-starter/`, …: one subfolder per project (numbered for order).

Each project folder (e.g. `00-dualreveal/`) is self-contained:
- Its own `src/`, `docs/`, `tests/`, config files, and dependencies.
- New projects use the next number (e.g. `02-my-next-app/`).

Within a project, keep code organized and predictable:
- `src/` for implementation code.
- `tests/` for automated tests (e.g. Playwright in `00-dualreveal`).
- `docs/` for setup and product/plan docs.
- `assets/` for images or downloadable artifacts when needed.

## Build, Test, and Development Commands
Each project folder owns its own commands: read its `README.md` before running anything. This file deliberately holds no per-project command list, so nothing goes stale here.
- `00-dualreveal/`, `01-lit-starter/`, `02-lit-admin-starter/`: npm scripts (`dev`, `build`, `start`, `test`).
- `03-second-brain-ingester/`, `04-spring-boot-api/`, `05-MyLifeOps/`, `06-Rubik/`: see the project `README.md`.
- `03-barefoot-python/`: no README yet — read the project for its entrypoint.
- `08-dashboard/`: no install and no build tool — `node 08-dashboard/build.mjs` writes
  `dist/`, `node --test 08-dashboard/tests/` runs its tests.

### Root-level deploy pipeline
There is no root `package.json`; these use Node 22's built-in runner and need no install.
- `apps.json` – the Apps Registry: every App and Service with its Deploy Target and build.
- `node --test scripts/` – every pipeline module test.
- `node scripts/validate-apps.mjs` – validate the registry, exits non-zero on any problem.
- `node scripts/plan-changes.mjs --changed <path>...` – print the deploy matrix for paths;
  `--app <slug|all> [--ref REF]` asks the manual question instead, with the stage
  derived from the ref.
- `node 08-dashboard/build.mjs` – build the Dashboard from the registry into
  `08-dashboard/dist/`; `node --test 08-dashboard/tests/` runs its tests.
- `node scripts/provision.mjs` – print each entry's provisioning descriptions and change
  nothing; `--plan` diffs them against the account and `--apply` converges it. Both need
  `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` (see `docs/deploy-credentials.md`).
- `node scripts/describe-deploy.mjs --slug <slug> --ref <ref>` – what the deploy workflow
  is told for one App: stage, project, branch and the folder to upload. Refuses an
  unimplemented target.
- `node scripts/build-app.mjs --slug <slug>` – build one App by the convention in
  `scripts/lib/build.mjs` (`package.json` → npm, `build.mjs` → node, neither → already the
  artifact), so no workflow knows how any App builds.
- `.github/workflows/deploy.yml` – the one deploy entrypoint, dispatch-only for now;
  `_deploy-app.yml` is the reusable workflow it calls per App. Neither holds per-project
  knowledge.
- `.github/workflows/` – live workflows only. Retired ones are kept, unchanged, in
  `docs/retired-workflows/`, because GitHub only runs what sits in the workflows folder.

## Coding Style & Naming Conventions
- Documentation is Markdown; use ATX headings (`#`, `##`) and `-` for bullets.
- Keep headings in sentence case and keep paragraphs short.
- Prefer ASCII characters and avoid decorative Unicode.
- New documentation files should use kebab-case names (e.g., `project-overview.md`).
- Prioritize the single responsibility principle in implementation code.
- Avoid producing enormous classes or modules; split orchestration, normalization, I/O, and formatting into focused components before a file becomes hard to review.

## Testing Guidelines
- Per-project: e.g. DualReveal’s Playwright tests live in `00-dualreveal/tests/e2e`.
- `01-lit-starter/tests/` uses Vitest with `jsdom` for controller and template behavior.
- `02-lit-admin-starter/tests/` uses Vitest with `jsdom` for Lit shell rendering and login flow coverage.
- Use Playwright for browser automation and keep tests flow-focused.
- Run tests from the project directory: `npm run test`.

## Commit & Pull Request Guidelines
The existing history uses short, direct messages (e.g., "Initial commit"). Continue with concise, imperative summaries (50-72 characters), and add a body when context is needed.

Pull requests should include:
- A brief summary of changes.
- The motivation or linked issue, if applicable.
- Notes on any follow-up work or open questions.

## Security & Configuration Tips
Do not commit secrets. If the project gains external dependencies or API keys, store them in a local `.env` file and document required variables in the README with safe example values.

## Agent-Specific Instructions
Keep this guide up to date as the repository grows. If you change structure or add tooling, update the relevant sections here so new contributors can get started quickly.
- For projects that use `devbox.json` workflow entrypoints, add or update the matching `shell.scripts` entry whenever a new runnable slice or workflow command is introduced, and reflect that change in the project README in the same update.
- For projects that use `devbox.json` test entrypoints, add or update a bounded `shell.scripts` test command whenever new slice-specific tests are introduced, so the new coverage is runnable through a stable Devbox command instead of only through ad hoc `pytest` arguments.

## Local git hooks
- The repo includes `.githooks/pre-commit` to validate staged GitHub Actions workflow files.
- Enable it locally with `git config core.hooksPath .githooks`.

## Agent skills

### Issue tracker

Issues live as GitHub Issues in this repo, driven by the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical roles, default label strings: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` at the root, ADRs in `docs/adr/`, project glossaries under `<project>/docs/glossary.md`. See `docs/agents/domain.md`.
