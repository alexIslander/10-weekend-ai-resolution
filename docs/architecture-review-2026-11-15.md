# Deploy pipeline architecture review — 2026-11-15

Review of the deploy architecture as designed in this session, plus the ten workflows it
is meant to replace. Read alongside `GLOSSARY.md` and `docs/adr/0001`–`0005`.

The HTML report from this review lived in the OS temp directory and will not survive;
this file is the durable record.

## Scope

- `.github/workflows/` — all 10 files, 658 lines
- the planned modules: `apps.json`, `deploy.yml`, `_deploy-app.yml`, `scripts/*.mjs`,
  `08-dashboard/`
- `GLOSSARY.md`, `docs/adr/`, `AGENTS.md`

Not reviewed: the application code inside `00-` … `07-`, the GitHub Pages setup in
`06-Rubik`, and the MyLifeOps build gap (deferred to its own spec).

## Vocabulary

module · interface · implementation · depth · deep · shallow · seam · adapter · leverage
· locality. A workflow is the module; its inputs, env, secrets, ordering constraints and
required repo variables are its interface.

## Candidates

| # | Candidate | Strength | Disposition |
|---|---|---|---|
| 1 | Six of the ten modules cannot run — retire, don't delete | Worth exploring | Chosen for follow-up |
| 2 | Derive `stage` behind the seam; interface is `{slug, ref, dry_run}` | Strong | Folded into `_deploy-app.yml` design |
| 3 | Collapse ten copies of every invariant into `_deploy-app.yml` | Strong | Folded into `_deploy-app.yml` design |
| 4 | Give change→App mapping a testable interface — one pure `plan()` | Strong | Chosen for follow-up |
| 5 | One target adapter table, not three branches | Worth exploring | Chosen for follow-up |
| 6 | Stop shipping the registry's full shape to the browser | Worth exploring | Chosen for follow-up |

Candidate 2 and 3 are not code changes; they are constraints on how `_deploy-app.yml` is
written, so they travel with the workflow rather than as their own ticket.

Candidate 1 contradicts the decision to keep all workflows. Reconcile: **retire, don't
delete** — move the six broken files out of `.github/workflows/` and keep them as the
input to the MyLifeOps spec.

## Confirmed defects

Each verified against the files, not inferred.

| Defect | Where | Effect |
|---|---|---|
| Six workflows run `npm ci` against a folder with no `package.json`, lockfile or Vite config | `mylifeops-{ci,preview,production}.yml`, `mylifeops-admin-{ci,preview,production}.yml` | Fail at step 2 of every run |
| `05-MyLifeOps/admin/` has no tracked files at all | `mylifeops-admin-*` | A clean checkout has no `dist` to upload |
| `CLOUDFLARE_PAGES_PROJECT_NAME` is the fallback for both `lit-starter` and `mylifeops` | `lit-starter-*.yml`, `mylifeops-*.yml` | One repo variable retargets two Apps |
| `cancel-in-progress: true` on all three production groups, with a static group name | `*-production.yml` | A second merge to `main` cancels the in-flight deploy; `main`'s head can end up not live |
| "Verify Cloudflare secrets" runs after the build | all six deploy workflows | A missing token costs a full build and reports as a deploy failure |
| `mylifeops-ci` excludes `05-MyLifeOps/admin/**` | `mylifeops-ci.yml` | An admin-only PR never triggers it; if the check is required, it stays pending and blocks the PR |
| `submodules: true` on six checkouts | six workflows | No-op: no `.gitmodules` exists |
| Three incompatible concurrency schemes | all ten | `-ci-${ref}`, `-preview-${head_ref}`, static `-production` |
| `npx wrangler@3` floats a major version | six deploy steps | Deploy behaviour can change without a commit |
| `--commit-dirty true` on every deploy | six deploy steps | Suppresses the warning that would catch a stale `dist` |
| `rubik-pages.yml` deploys from `feature/06-rubik` and `main` under one group | `rubik-pages.yml` | A feature-branch push is subject to the `github-pages` environment's branch protection |

## Findings that are proposals, not defects

- `url` is derivable from `slug` for `pages` and `workers` targets, so only `aws` needs a
  literal. Removing it removes a second source for a hostname.
- The dashboard build copies `apps.json` verbatim, which ships `build.dir` and `target`
  into a public bundle. Two derived views would narrow each consumer's interface.
- `resolveTarget()` should be one adapter table read by both `provision.mjs` and the
  deploy workflow, so ADR-0005's "never attach a Pages domain to an AWS origin" rule is
  executable rather than remembered.

## Known open detail

`06-Rubik` publishes every file in the folder, including `tools/`, `tests/` and
`source/`. Excluding them is a separate, later ticket; do not solve it while building the
pipeline.
