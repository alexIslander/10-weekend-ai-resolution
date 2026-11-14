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

`tests/drill.spec.js` covers the single-position drill: one diagram, four
triggers in a changing order, nothing identifying before the answer, immediate
feedback, and the reveal with case name, OLL number, step count, route and
simulator link. It runs at a portrait phone viewport in Chromium, Firefox and
WebKit.

Browser-free tests (the generated data and the drill's rules) are `node --test`
from the project root, not here — nothing needs installing for those.
