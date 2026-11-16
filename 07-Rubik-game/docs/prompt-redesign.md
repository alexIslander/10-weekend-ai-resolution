# Prompt — the 07-Rubik-game redesign queue

You are the implementation agent for `07-rubik-game` in
`/Users/scsete/workspace/2026/10-weekend-ai-resolution`. Your queue is six GitHub
issues (#12–#17) that redesign this game: a dashboard home, a light/dark theme, and
the ability to skip an open run. Do nothing outside those six issues.

## Read before touching code, in this order

1. `AGENTS.md` (repo root) — project rules for this workspace.
2. `07-rubik-game/README.md` — how it runs. Note the rule: **no build step, never
   introduce a bundler.** Vite/Webpack/esbuild resolve the bare `lit-html` and
   `@reduxjs/toolkit` imports themselves and break the import map.
3. `07-rubik-game/docs/glossary.md` — the vocabulary is binding. Position, Trigger,
   Step, Route, AUF, Group, Mode, Hint level, Run, Open run, Skip, Drill, Board.
   Use these words in code, UI copy and commit messages. Never write "game" or
   "session" where the glossary says Run.
4. `07-rubik-game/docs/adr/0001`–`0006`. Two govern this queue:
   **ADR-0005** (a skipped run is discarded, via a record snapshot taken at run
   start) and **ADR-0006** (dashboard home, the guide's design system, tri-state
   theme before first paint, Font Awesome paths vendored into `app/src/icons.js`).
   Do not revisit them. If you think one is wrong, stop and say so.
5. `07-rubik-game/docs/spec.md` — product rules. Story 29 is what ADR-0005 settles;
   the Navigation paragraph now points at ADR-0006.
6. `07-rubik-game/docs/tickets.md` — the queue and its blocking edges, mirrored by
   the issues. If an issue and that table disagree, the table wins.
7. `07-rubik-game/docs/design/rubik_s_cube_8_step_solve_guide.html` — visual
   reference. Copy its tokens, components and feel: `--rubik-*` palette,
   `--bg-*`/`--text-*` semantics, `[data-theme="dark"]` block, colour bar, CSS 3×3
   logo, nav pills, `.card`, `.step-badge`, `.cube-3x3`, `.algo` in JetBrains Mono.
   Never copy its content (no 8-step guide, no basics section) and never serve it.

Then read the six issues: `gh issue view 12` … `gh issue view 17`.

## The queue

| # | Ticket | Blocked by |
| --- | --- | --- |
| 12 | Design system, shell and theme | — |
| 13 | Dashboard home | #12 |
| 14 | Skip an open run | #13 |
| 15 | Play surfaces restyled | #12, #13 |
| 16 | Elapsed time from play, not the wall clock | #13, #14 |
| 17 | Docs and e2e pass | #13, #14, #15, #16 |

Start on `feature/07-rubik-redesign`, branched from `feature/07-rubik-game`. Work
the frontier only: a ticket starts after everything blocking it is closed with
evidence. #14 cannot start until #13 is closed, however tempting.

Tickets #9 (AUF), #10 (Adaptive) and #11 (keyboard) stay untouched until all six of
these land. Their dashboard cards, colours and glyphs are already reserved by
ADR-0006; that reservation is not permission to build the modes.

## Loop, per ticket

1. `gh issue comment <n> --body "claiming"` before you start; it stops a second
   agent taking the same ticket.
2. Write, in your first message after claiming, the 3–6 steps you will take and the
   files you expect to touch. If that list includes a file no ticket mentions and
   the change is not forced by one, stop and ask.
3. Implement. Keep the shape the codebase already has: rules in
   `app/src/quiz/core/` as plain ESM with injected `random`/`now`, state in
   `app/src/quiz/entity/`, commands in `app/src/quiz/control/`, rendering in
   `app/src/quiz/boundary/`. A rule that lives in a custom element is a bug.
4. Verify with the exact evidence below. A ticket is not done because it looks
   right in a browser.
5. Commit per ticket, imperative, 50–72 characters (e.g. "Make the dashboard the
   home screen"). No `--no-verify`, no amend of someone else's commit.
6. Close the issue with `gh issue close <n> --comment "<what landed> · <evidence>"`.

## Evidence, in every ticket

```bash
cd 07-rubik-game
node --test                                        # must stay green
npx -y -p typescript tsc -p app/src/jsconfig.json  # must stay clean
cd tests && npx playwright test                    # chromium/firefox/webkit
```

Plus, where the ticket changes something visible: `cd app && npx serve -s src -l 3006`,
open `/`, `/stats`, `/scores` in **both themes**, and say in the closing comment what
you saw. The e2e suite runs at a portrait phone viewport; a desktop-only layout that
breaks at 390 px fails the ticket.

## Hard rules

- No new dependency, bundler, framework, CSS library or icon package. Font Awesome
  icons are vendored path data in `app/src/icons.js`; the Google Fonts links
  (Inter, JetBrains Mono) are the only network references in the document head.
- No second localStorage key for app state. The store keeps persisting whole under
  its one template key; the theme uses `rubik-theme` because it must be resolved
  before first paint.
- Every interactive element the e2e suite touches carries a `data-testid`; tests
  select on those, never on a class name.
- Do not rename the glossary's words, and do not introduce new domain terms. If a
  new concept appears (it should not), stop and ask.
- Do not touch `06-Rubik/`, `scripts/generate-cases.mjs`, `app/src/quiz/entity/cases.json`
  or the 57 diagrams. The diagrams stay opaque; they sit in white sticker tiles.
- Do not edit `docs/adr/`. A correction to a settled decision is a question for the
  human, not a patch.
- `docs/spec.md` and `docs/glossary.md` change only when behaviour changed; `README.md`
  changes in #17, not before.
- Keep the diff reviewable: one ticket, one concern. If a ticket turns out to need
  two, comment on the issue and split it — do not quietly grow it.

## When to stop and ask

Stop, comment on the issue and wait if: a ticket contradicts an ADR; a ticket needs
a decision the tickets do not make (mode colours, badge glyphs and the theme cycle
are decided — inventing a seventh mode card is not); a test fails for a reason you
cannot explain in one sentence; or the third attempt at the same problem fails.

## Done, for the whole queue

All six issues closed with evidence, working tree clean, `node --test` green,
`tsc` clean, Playwright green on three browsers, and a short handoff in
`docs/handoff.md` — what shipped, the evidence of the last full run, and what is
left of #9–#11.
