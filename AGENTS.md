# Repository Guidelines

## Project Structure & Module Organization
Top-level structure:
- `README.md`: primary project description and entry point.
- `docs/`: developer and testing guides.
- `dualreveal/docs/`: product plans and reference docs.
- `src/`: application code (components, routes, and helpers).
- `tests/`: Playwright end-to-end tests.
- `supabase/`: database migrations.
- `LICENSE`: licensing terms.

If you add new source code or assets, keep it organized and predictable:
- `src/` for implementation code (e.g., `src/agent/` or `src/lib/`).
- `tests/` for automated tests (mirrors `src/`).
- `assets/` for images or downloadable artifacts.
- `docs/` for longer-form documentation beyond the README.

## Build, Test, and Development Commands
- `npm run dev` starts the Next.js development server.
- `npm run build` builds the production bundle.
- `npm run start` runs the production server.
- `npm run test` runs Playwright end-to-end tests.
- `npm run test:e2e` runs Playwright end-to-end tests (alias).

## Coding Style & Naming Conventions
- Documentation is Markdown; use ATX headings (`#`, `##`) and `-` for bullets.
- Keep headings in sentence case and keep paragraphs short.
- Prefer ASCII characters and avoid decorative Unicode.
- New documentation files should use kebab-case names (e.g., `project-overview.md`).

## Testing Guidelines
- End-to-end tests live in `tests/e2e`.
- Use Playwright for browser automation and keep tests flow-focused.
- Run tests with `npm run test`.

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
