# The Apps Registry is a static file, generated into the Dashboard at build time

`apps.json` is committed at the repo root. A build step copies it into
`08-dashboard/src/registry.generated.json` before `vite build`, so the Dashboard renders
from data baked in at build time and never calls the Cloudflare API.

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
