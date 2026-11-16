# One registry with a Deploy Target field, not one workflow per hosting style

`apps.json` carries a `target` field (`pages`, `workers`, `aws`), and the deploy workflow
selects behaviour from that value instead of inferring it from the folder name.

The monorepo does not have one hosting story: Vite and plain-HTML projects go to Pages,
the Next.js project needs the Workers adapter, and the backend projects are reached
through a `csete.cc` hostname pointing at AWS. Encoding that in the data keeps a single
deploy entrypoint and a single source of truth for hostnames.

## Considered Options

- **A workflow per hosting style** (`deploy-pages.yml`, `deploy-workers.yml`,
  `deploy-aws.yml`) — clearer per file, but the registry could no longer drive the
  matrix, and adding an App would mean picking a workflow as well as editing JSON.
- **Inferring the target from the folder contents** — no explicit field, but the
  inference rule lives in YAML where nobody reads it, and it silently misfires on a
  project that gains a bundler.

## Consequences

- The deploy workflow reads `target` and branches once, in one place. An unknown target
  is a hard failure rather than a skipped job.
- `target: "aws"` entries are deployable only in the sense that the Dashboard links
  them; no AWS credential or deploy step exists yet.
