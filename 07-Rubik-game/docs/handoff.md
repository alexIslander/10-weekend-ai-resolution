# Handoff — 2026-11-15

Where this project stands, so a new session can pick it up without the old chat.

## State

- Branch `feature/07-rubik-game`, 8 commits ahead of the last push, **nothing pushed**.
- Tickets #3–#8 implemented, reviewed (`/code-review`, two-axis) and ticked on GitHub.
  Tickets #9–#11 are open, labelled `ready-for-agent`.
- Working tree clean.

## Evidence (last full run)

```bash
cd 07-Rubik-game
node --test                          # 77 pass, 0 fail
npx -y -p typescript tsc -p app/src/jsconfig.json   # clean
cd tests && npx playwright test      # 136 pass, 2 skipped (chromium/firefox/webkit)
```

The 2 skips are the full 57-question runs, which only run in Chromium.

## Shipped

| # | What |
| --- | --- |
| 3 | App shell, generated 57-position data, single-position drill |
| 4 | Scored run: name, 57 questions, streak ladder, finish screen, per-position records |
| 5 | Persistence in the template's single localStorage key, boards per mode × hint level, tie-break, finish → board link |
| 6 | Mode picker (Random / Grouped / Progressive), 14 groups, Training / Test |
| 7 | Stats page at `/stats`: totals, per-mode, 14-group, weak-10 with one-question drills, reset, delete |
| 8 | Route mode: chips in tap order, explicit submit, all-or-nothing, own boards and stats |

## Left

- **#9 AUF mode** — the answer is the setup turn (`none` / `U` / `U'` / `U2`) *and* the
  trigger, both must be right. `none` is a valid AUF.
- **#10 Adaptive mode** — all 57 ordered by priority (Laplace-smoothed error rate +
  staleness, formula in `docs/spec.md`), optional stop after the worst N, and the
  "practise my weak spots" button the stats page now makes possible.
- **#11 Keyboard answering** — `1`–`4` answer the option in that position, focus moves
  to the next button so `Enter` advances. Sequenced after #10.

## Reading the app as a user

README has the two sections a new session needs for orientation: *Starting the app:
no login, no dashboard* (the start form is the home screen; `/` resumes an open run,
table of the three phases) and *A session, step by step* (play → run → finish →
scores → stats).

## How to run

```bash
cd 07-Rubik-game/app
npx serve -s src -l 3006     # no build step; never introduce a bundler
```

Routes: `/` play, `/stats` stats, `/scores` boards. A reload of any of them must reach
`index.html` — that is why the server needs `-s src`.

## Where the code is

- `app/src/quiz/core/` — every rule: `drill.mjs` (questions, verdicts), `run.mjs`
  (modes, pool, order, scoring, `DRILL`, `isBoardMode`, `nextRun`), `records.mjs`,
  `boards.mjs`, `stats.mjs`. Plain ESM, no DOM, no store, random injected.
- `app/src/quiz/entity/` — `RunReducer.js` (run slice, chips, name), `PlayersReducer.js`
  (per-position records + finished runs), `Positions.js` (the only door to cases.json).
- `app/src/quiz/control/` — `RunControl.js` (start, answer, chips, submit, next, drill),
  `PlayersControl.js` (reset stats, delete player).
- `app/src/quiz/boundary/` — `Play.js`, `Run.js`, `Finish.js`, `Scores.js`, `Stats.js`,
  `format.js`.
- Tests: `node-tests/*.test.mjs` (browser-free), `tests/tests/*.spec.js` (Playwright).

## Known gaps, deliberate

- **No way to abandon a run.** State persists, so a half-played run resumes on every
  reload until it is finished. No UI to throw one away.
- Elapsed time is wall-clock from the run's start, so a resumed run carries its downtime.
  It only breaks board ties.
- A drill runs at `Test` and shows no board link; that is intentional.
- Per-mode accuracy uses finished runs only; group accuracy, weak spots and totals count
  every answer, including answers from an abandoned run. Documented in README and on #7.
- A name is identity, not authentication: no login, no accounts, no server.
