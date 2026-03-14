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
Run from the project folder (e.g. `00-dualreveal/`):
- `npm run dev` – Next.js dev server (DualReveal).
- `npm run build` – production bundle.
- `npm run start` – production server.
- `npm run test` / `npm run test:e2e` – Playwright e2e tests (DualReveal).

Run from `01-lit-starter/`:
- `npm run dev` – Vite dev server for the standalone Lit starter.
- `npm run build` – production build to `dist/`.
- `npm run start` – local preview of the production build.
- `npm run test` / `npm run test:watch` – Vitest coverage for the controller and templates.

## Coding Style & Naming Conventions
- Documentation is Markdown; use ATX headings (`#`, `##`) and `-` for bullets.
- Keep headings in sentence case and keep paragraphs short.
- Prefer ASCII characters and avoid decorative Unicode.
- New documentation files should use kebab-case names (e.g., `project-overview.md`).

## Testing Guidelines
- Per-project: e.g. DualReveal’s Playwright tests live in `00-dualreveal/tests/e2e`.
- `01-lit-starter/tests/` uses Vitest with `jsdom` for controller and template behavior.
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

## Local git hooks
- The repo includes `.githooks/pre-commit` to validate staged GitHub Actions workflow files.
- Enable it locally with `git config core.hooksPath .githooks`.
