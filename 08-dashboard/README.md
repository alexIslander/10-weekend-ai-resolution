# Dashboard

The page served at `apps.csete.cc` that renders every entry in the Apps Registry as a Tile,
with Services as labelled links rather than Tiles.

Not built yet. This folder exists so the `apps` entry in the root `apps.json` has a
`build.dir` on disk: the registry validator checks that every build directory is real, and
an empty, untracked folder would fail that check on a clean clone.

## What it will be

- Reads `apps.json` from the repo root, copied into the bundle at build time. It never
  calls the Cloudflare API, because a token in a public page cannot be protected
  (ADR-0003).
- Renders Apps as Tiles and Services as labelled links, using the registry's Tile view.
  It does not receive the deploy fields (`target`, `build`), so those cannot leak into a
  public bundle.
- Builds to `dist/`, deployed to the Cloudflare Pages project `10-weekend-ai-resolution`
  and served at `apps.csete.cc` (ADR-0001, which also notes the apex is taken).
- Reflects what the repo says, not what the account is doing: no live deployment status.
