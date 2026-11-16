# Glossary

The project's domain language, one term per entry. When a concept is named in an
issue, a ticket, a test, or a proposal, use the term as defined here.

Format: `**Term** — definition. Avoid: synonym-a, synonym-b.`

## Terms

**App** — a self-contained UI project folder that builds its own static bundle and is
deployed on its own hostname. A folder that cannot produce a static `dist` is not an
App, however runnable it is.
_Avoid_: project, site

**Service** — a non-UI deployable (API, batch job) reachable at a `csete.cc` hostname. It
appears in the Apps Registry and on the Dashboard as a labelled link, never as a Tile.
_Avoid_: app, backend app, microservice

**App Slug** — the lowercase kebab-case name of an App, used as its production subdomain
label (`<slug>.csete.cc`) and its deploy-target name.
_Avoid_: app name, project id

**Apps Registry** — the root `apps.json` listing every App and Service. Single source of
truth for the Dashboard, the deploy matrix, and each entry's production hostname, so
adding one is a one-line change there rather than a workflow edit.
_Avoid_: app list, manifest, config

**Deploy Target** — how an entry's artifact reaches the internet: `pages` (static bundle
on Cloudflare Pages), `workers` (SSR bundle on Workers), or `aws` (external origin behind
a grey-cloud CNAME, not deployed from this repo).
_Avoid_: host, platform, provider

**Dashboard** — the page served at `apps.csete.cc` that renders every entry in the Apps
Registry as a Tile.

**Tile** — one card on the Dashboard standing for one App; its only job is to link to
that App's hostname.
_Avoid_: card, item, entry

## Project glossaries

Each self-contained project folder may keep its own vocabulary.

- `07-Rubik-game/docs/glossary.md` — cube positions, tools, and game vocabulary.
