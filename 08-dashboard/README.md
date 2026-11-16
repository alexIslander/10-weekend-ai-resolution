# Dashboard

The page served at `apps.csete.cc` that renders every entry in the Apps Registry: Apps as
Tiles, Services as labelled links.

## Build

```bash
node 08-dashboard/build.mjs             # → 08-dashboard/dist
node --test 08-dashboard/tests/         # the view model, the page, the build
```

No dependencies and no install step: Node's built-in test runner, ES modules, and a static
document. `dist/` holds `index.html` and `style.css` and nothing else, so it stays out of
git and is exactly what the deploy step uploads.

## How it works

- `src/view-model.mjs` — the one seam. Registry entries in, ordered Tiles and ordered
  Service links out, through the registry module's Tile view. Deploy fields (`target`,
  `project`, `build`) cannot reach the page, because the view model never carries them.
- `src/render.mjs` — a pure function from that view model to a complete HTML document.
- `src/build.mjs` — loads and validates the root `apps.json`, renders, writes `dist/`. A
  registry that does not validate stops the build.
- `src/page.css` — the whole look. No fonts, images or scripts to fetch.

The registry is baked in at build time by rendering, not by copying a data file into the
bundle: there is no `registry.json` and no client JavaScript in `dist/`, so the shipped
page cannot call the Cloudflare API and cannot leak a token (ADR-0003). A test asserts the
shipped bytes contain no deploy field.

## What it is not

- Not live status: it reflects what the repo says, not what the account is doing.
- Not a router: each Tile links straight to the App's own hostname. Path aliases under
  `apps.csete.cc` are deferred in ADR-0001.
- `live` is a registry field. Every entry starts `false`, which the page shows as
  "not live yet"; flipping it to `true` and rebuilding is the last step of
  <https://github.com/alexIslander/10-weekend-ai-resolution/issues/25>.

## Hosting

Pages project `10-weekend-ai-resolution`, built from this folder to `dist/` and served at
`apps.csete.cc` — see the `apps` entry in `apps.json` and ADR-0001 (the apex is taken).
