# The Apps Registry is a static file, generated into the Dashboard at build time

`apps.json` is committed at the repo root. The Dashboard's build reads it, validates it,
and renders the page from that data, so the Dashboard renders from the registry baked in
at build time and never calls the Cloudflare API.

A live Dashboard would need an API token inside a public page, which is a credential in a
place that cannot protect it. The static file also gives a property worth more than live
status: the Tile list and the deploy matrix read the same data, so they cannot disagree.

## Consequences

- Deployment health is not shown on the Dashboard. It reflects what the repo says, not
  what the account is doing.
- `apps.json` and the Dashboard only agree with reality after a commit and deploy, so an
  App removed from the registry keeps its Tile until the next Dashboard build.
- Moving to live data later (Workers plus a secret, per the dynamic path) is a Dashboard
  change only; the registry shape survives it.

## Amendment — how the data gets in

This ADR originally named one mechanism: copy `apps.json` into
`08-dashboard/src/registry.generated.json` before `vite build`, and render client-side.
The first Dashboard build does something narrower, so the mechanism is recorded here
rather than left to disagree with the code:

- There is no `vite build` and no bundler. There is no root `package.json` and none is
  wanted, and the Dashboard needs no dependency to render a list.
- There is no generated data file. The build renders the registry into `index.html` and
  emits no JSON and no client script, so the shipped folder holds a document and a
  stylesheet. Nothing in the bundle can read the registry, call an API, or leak a token,
  because nothing in the bundle executes.
- The decision above is unchanged: static, committed, baked in at build time, deploy
  fields kept out of the public bundle. The name of this ADR stays accurate — the registry
  is still the Dashboard's input at build time; it is rendered, not copied.

The trade-off, stated plainly: a client-rendered page could later show more without a
rebuild. Any such move is the "live data later" consequence above, and would bring its own
mechanism with it.
