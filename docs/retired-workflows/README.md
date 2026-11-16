# Retired workflows

Six workflows were moved here unchanged on 2026-11-15, when the deploy pipeline was
designed. Nothing was deleted. They are kept as evidence, and as the input to the
MyLifeOps spec.

A seventh, `rubik-pages.yml`, was moved here unchanged on 2026-11-16 for the opposite
reason: it ran, and it published. It has its own section below, because it does not
belong in the defect table.

The six were retired because none of them could run. Every one failed at step 2,
`npm ci`, against a `05-MyLifeOps` folder that has no `package.json`, no lockfile and no
Vite config. No run ever reached a deploy step, so nothing here ever deployed anything and
no deployment history depends on it.

The confirmed defects behind the decision are in the defect table of
[the architecture review](../architecture-review-2026-11-15.md#confirmed-defects). Read
that table first; the notes below only say which defect belongs to which file.

## What each file was, and why it was retired

| File | Intended job | Defects it carries |
|---|---|---|
| `mylifeops-ci.yml` | Build and test MyLifeOps on PRs to `main` | `npm ci` with no package; excludes `05-MyLifeOps/admin/**`, so an admin-only PR never triggers it |
| `mylifeops-preview.yml` | Deploy a staging build per PR branch | `npm ci` with no package; falls back to the repo variable shared with `lit-starter`; secrets checked after the build; `wrangler@3` floats; `--commit-dirty true` |
| `mylifeops-production.yml` | Deploy `main` to production | Same four, plus `cancel-in-progress: true` on a static concurrency group, so a second merge cancels the in-flight deploy |
| `mylifeops-admin-ci.yml` | Build and test the admin SPA on PRs | `npm ci` with no package; `05-MyLifeOps/admin/` has no tracked files at all |
| `mylifeops-admin-preview.yml` | Deploy the admin SPA per PR branch | `npm ci` with no package; no `dist` to upload from a clean checkout; secrets after build; floating `wrangler`; `--commit-dirty true` |
| `mylifeops-admin-production.yml` | Deploy the admin SPA to production | Same set, plus the static-production concurrency group |

Two more defects are shared by all six: `submodules: true` on a repo with no `.gitmodules`,
and one of three incompatible concurrency schemes across the ten workflows that existed.

## What replaces them

- The deploy pipeline described by [ADR-0001](../adr/0001-flat-hostnames-under-csete-cc.md)
  to [ADR-0005](../adr/0005-grey-cloud-cname-for-aws-origins.md), driven by `apps.json`,
  `scripts/lib/plan.mjs` and `scripts/lib/targets.mjs`.
- `deploy.yml` and `_deploy-app.yml` are the replacement entrypoints, and both exist as of
  2026-11-16. They are dispatch-only for now: a push trigger would deploy the same Apps the
  surviving per-project workflows still deploy, and retiring the last of those is its own
  ticket.
- The MyLifeOps build gap - no `package.json`, no lockfile, no Vite config, no admin
  sources - is its own spec. These six files are its starting point, not a template to
  copy: the fixes it needs are stated above, so re-adding them as-is would repeat known
  defects.

## `rubik-pages.yml`: the Rubik guides' GitHub Pages deploy

Moved here unchanged on 2026-11-16, after `rubik.csete.cc` served the same guides through
the deploy pipeline.

Unlike the six above it worked. It assembled `06-Rubik/*.html`, the images and the
reference PDF into a Pages artifact and published it on every push to `main` or
`feature/06-rubik` that touched `06-Rubik/`, at
`https://alexislander.github.io/10-weekend-ai-resolution/`.

It was retired because it was a second mechanism publishing one App. It had its own
trigger, its own `rubik-pages` concurrency group, its own artifact recipe that kept
`tools/`, `tests/` and `source/` out by copying a list of paths, and its own hostname.
Two copies of one folder drift the moment either recipe changes, and the guide's own
README then has to say which copy is the real one.

What replaces it: the `rubik` entry in `apps.json`, through `deploy.yml` and
`_deploy-app.yml`. It deploys `06-Rubik` as-is to the `rubik` Pages project and serves it
at `https://rubik.csete.cc/`. One known difference, tracked in the epic as a later
ticket: the pipeline uploads the whole folder, so `tools/`, `tests/` and `source/` are
published too, where this workflow filtered them out.

The repository's GitHub Pages site was **disabled** on 2026-11-16
(`DELETE /repos/alexIslander/10-weekend-ai-resolution/pages`), so nothing re-publishes and
the old URL no longer answers. That break is intentional: `rubik.csete.cc` is the only
copy. Re-enabling Pages would need this workflow back, which would restore the second
copy the retirement removed.

Do not move these files back into `.github/workflows/`. GitHub only runs workflows in that
folder, which is the point of retiring them rather than leaving them to fail.
