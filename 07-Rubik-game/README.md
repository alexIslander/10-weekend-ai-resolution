# 07-Rubik-game — trigger-recognition drill

A small client-side game for learning to *recognise* OLL positions: it shows one
position diagram at a time and asks which trigger solves it, then scores a run
of all 57. The booklet it drills is `../06-Rubik`; this project never imports
from it at runtime.

The vocabulary is fixed by [docs/glossary.md](docs/glossary.md) — position,
trigger, step, route, AUF, group, hint level. The feature spec is
[docs/spec.md](docs/spec.md), the settled decisions are
[docs/adr/0001](docs/adr/0001-ask-for-the-first-trigger.md)–[0004](docs/adr/0004-boards-split-by-mode-and-hint-level.md),
and the build order is [docs/tickets.md](docs/tickets.md). Built so far: the app
shell and generated position data (#3); the scored run (#4) — name, streak
ladder, finish screen, per-position records; boards derived from finished runs
(#5) with a `scores` page; and the three shipping modes with a selectable hint
level (#6) — `Random`, `Grouped`, `Progressive` at `Training` or `Test`.

## Serve

There is no build step. The app is custom elements over vendored lit-html, a
Redux-style store, the Navigation API router and an import map — served
statically, never bundled. **Never introduce Vite or any other bundler**: it
resolves the bare `lit-html` / `@reduxjs/toolkit` imports itself and breaks the
import map.

```bash
cd app
npx serve -s src        # http://localhost:3000, falls back to index.html for client-side routes
```

The fallback matters: `/` renders the play screen, `/scores` the boards, and a
reload of either must reach `index.html`. `zws.sh --single` (from the template) or browsersync
serve the same directory.

## Test

Browser-free — data shape and the drill's rules. No install, no package.json:

```bash
node --test             # run from this directory
```

The UI — Playwright, against the static server on port 3000:

```bash
cd tests
npm install             # once
npx playwright test     # starts the static server itself (see playwright.config.js)
```

The e2e suite runs in Chromium, Firefox and WebKit at a portrait phone viewport.

## Regenerate the position data

`app/src/quiz/entity/cases.json` and the 57 diagrams in `app/src/img/` are
generated from the booklet. The file is **data: commit it, never hand-edit it**.
Change it by regenerating:

```bash
node scripts/generate-cases.mjs          # rewrite cases.json and copy the diagrams
node scripts/generate-cases.mjs --check  # fail if the committed file is stale
```

The generator reads `../06-Rubik/tests/fixtures/oll_routes.json` (OLL number,
case name, diagram, step count, route) and
`../06-Rubik/minimal-without-flows-print.html` (the 14 group headings, in
booklet order), copies the diagrams each position references, and then asserts:
57 positions, unique OLL numbers, group sizes 7/2/2/2/2/2/4/4/4/4/4/6/6/8 summing
to 57, step counts 4/32/21, every route as long as its step count, every AUF in
{`none`, `U`, `U'`, `U2`}, and every referenced diagram present. The same
assertions run in `node --test` against the committed file.

Two traps the generated file must not fall into:

- `friedrich-oll-NN.png` is **not** OLL case NN. The diagram is copied from the
  fixture's `image` mapping, never derived from the OLL number.
- The 14 group names exist only in the print HTML. Reordering that file is a
  data change, so the group sizes catch it.

## Layout

```
app/src/
  index.html            import map, nav, route outlet
  app.js                route table; state persistence
  router.js             Navigation API + URLPattern (template; route example in its docs renamed)
  store.js              slice registration (template mechanism, `run` + `players`)
  reduction.js          minimal Redux Toolkit over structuredClone (template)
  BElement.js           store subscription + lit-html render base (template)
  libs/                 vendored lit-html, optional Redux Toolkit
  quiz/
    core/drill.mjs      pure ESM: one question and its verdict, random injected
    core/run.mjs        pure ESM: which positions a run asks, what an answer is worth
    core/boards.mjs     pure ESM: how finished runs rank on a board
    core/records.mjs    pure ESM: how an answer changes a position's record
    core/random.mjs     the injected shuffle
    entity/             cases.json (generated), Positions.js, RunReducer.js, PlayersReducer.js
    control/            RunControl.js: the actions the screens dispatch
    boundary/Play.js    `q-play`: name, mode, group, hint level, and the way into a run
    boundary/Run.js     `q-run`: question, progress, score, feedback, reveal
    boundary/Finish.js  `q-finish`: score, correct, accuracy, elapsed, the way to the board
    boundary/Scores.js  `q-scores`: a mode per section, a column per hint level
    boundary/format.js  how screens write labels, dates and durations
scripts/
  generate-cases.mjs    booklet -> cases.json + img/
  assert-cases.mjs      what the generated file must satisfy (used by both)
node-tests/             node --test: data shape, answer evaluation
tests/                  Playwright e2e
```

`quiz/core` is the only place that decides *what happens*: no DOM, no store, no
imports outside itself. Components render its output; controls dispatch.

A run is one mode at one hint level, both chosen on the play screen. `Random`
asks all 57 positions shuffled; `Grouped` asks one of the 14 booklet groups,
shuffled; `Progressive` asks the 4 one-step positions, then the 32 two-step,
then the 21 three-step, shuffled within each block. `Progressive` starts at
`Training`, the other modes at `Test`, and the hint level can be overridden for
any mode: `Training` keeps the case name and OLL number on screen while asking,
`Test` shows nothing identifying until the answer. The reveal is the same at
both levels. A correct
answer is 10 points times a streak multiplier that climbs to 5 (**ADR-0004**);
a miss scores nothing and resets the multiplier. Either way the answer reveals
the position — its case name, OLL number, group, step count and route — before
the next question. Every answer updates the player's per-position record
(`attempts`, `correct`, `wrong`, `lastSeenAt`, `streak`), and a finished run is
appended to that player's history — the data the boards and stats (#7) read.

State lives in the template's single localStorage key, exactly as the spec's
Persistence decision asks: a reload resumes the run on screen and keeps the
records, and an unfinished or reloaded run writes no score.

Boards are a view, never a second copy: `core/boards.mjs` derives them from the
finished runs on every render — one board per mode and hint level, six today
(**ADR-0004**),
ranked by score, a tie going to the faster run. The `scores` page presents a
mode as one section with a column per hint level, so a `Training` score is never
read as a `Test` one; each row shows rank, name, score, the date the run
finished, and its elapsed time, which is what makes a tie readable. A board with
no finished run says so. Each board is anchored as `#board-<mode>-<hint level>`,
so the finish screen's "see the board" lands on the board the run just joined
without retyping the name. A name is identity, not authentication: typing a new
one starts writing that name's records, and two names on one device keep
independent histories.

Elapsed is wall-clock from the start of the run, so a run resumed after a reload
carries its downtime. It ranks ties only and is never a deadline, so the cost is
a slightly unkind tie-break rather than a wrong score; measuring play time
properly belongs with the stats ticket.

## Deviations from the template

The host app is the bce.design quickstarter with its sample bookmarks bounded
context removed. Where this project differs from the template, it is because the
ticket asked for it or because a test needed it, and each is deliberate:

- `app/src/bookmarks/` is gone, together with its reducer, route, nav entry,
  page title and Playwright spec. Its component styles in `style.css` are
  replaced by the run screen's.
- `app/src/style.css` keeps the template's tokens, grid and container queries;
  the phone layout is made full-bleed by a media query, because the body cannot
  query its own container size.
- `app/src/libs/lit-html.d.ts` gains `nothing`, an export of the vendored module
  the drill now uses.
- `tests/playwright.config.js` enables the `webServer` block the template leaves
  commented out, so one command runs the suite against the static server.
- `app/src/router.js` is the template's, with two changes: the route example in
  its doc comment is renamed (so no sample context name survives), and an
  intercepted navigation with a fragment scrolls to it — the Navigation API's
  own fragment handling never runs once the navigation is intercepted.
