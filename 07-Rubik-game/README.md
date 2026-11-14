# 07-Rubik-game — trigger-recognition drill

A small client-side game for learning to *recognise* OLL positions: it shows one
position diagram at a time and asks which trigger solves it. The booklet it
drills is `../06-Rubik`; this project never imports from it at runtime.

The vocabulary is fixed by [docs/glossary.md](docs/glossary.md) — position,
trigger, step, route, AUF, group, hint level. The feature spec is
[docs/spec.md](docs/spec.md), the settled decisions are
[docs/adr/0001](docs/adr/0001-ask-for-the-first-trigger.md)–[0004](docs/adr/0004-boards-split-by-mode-and-hint-level.md),
and the build order is [docs/tickets.md](docs/tickets.md). This ticket (#3) is
the app shell, the generated position data and the single-position drill.

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

The fallback matters: `/` renders the drill, and a reload of any nested route
must reach `index.html`. `zws.sh --single` (from the template) or browsersync
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
  router.js             Navigation API + URLPattern (template, unchanged)
  store.js              slice registration (template, unchanged mechanics)
  reduction.js          minimal Redux Toolkit over structuredClone (template)
  BElement.js           store subscription + lit-html render base (template)
  libs/                 vendored lit-html, optional Redux Toolkit
  quiz/
    core/drill.mjs      pure ESM: the question and the verdict, random injected
    entity/             cases.json (generated), Positions.js, DrillReducer.js
    control/            DrillControl.js: actions dispatched from the UI
    boundary/Drill.js   the `q-drill` custom element
scripts/
  generate-cases.mjs    booklet -> cases.json + img/
  assert-cases.mjs      what the generated file must satisfy (used by both)
node-tests/             node --test: data shape, answer evaluation
tests/                  Playwright e2e
```

`quiz/core` is the only place that decides *what happens*: no DOM, no store, no
imports outside itself. Components render its output; controls dispatch.
