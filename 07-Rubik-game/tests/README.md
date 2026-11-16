# e2e test

installed with:

`npm init playwright@latest`

## run test

The config starts the app's static server on port 3000 itself, so one command is
enough:

`npx playwright test`

With the UI: `npx playwright test --ui`. To test against a server you started
and are watching, serve `../app/src` (`npx serve -s src`) and run the same
command — an existing server on port 3000 is reused.

Open reports: `npx playwright show-report`

## what is here

`tests/run.spec.js` covers the name prompt, a scored `Random` run (progress,
score, the streak ladder and its reset), the reveal after a miss (case name,
OLL number, step count, route, simulator link) and the finish screen. The spec
reads `app/src/quiz/entity/cases.json` so it knows which trigger the booklet
gives for the diagram on screen, and can therefore answer right or wrong on
purpose instead of guessing. It runs at a portrait phone viewport in Chromium,
Firefox and WebKit; the full 57-position run runs once, in Chromium.

Browser-free tests (the generated data and the run's rules) are `node --test`
from the project root, not here — nothing needs installing for those.
