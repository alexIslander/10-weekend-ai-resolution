# Staging hostnames are Pages branch aliases, and need no per-project setup

A staging deploy is one command, and the hostname falls out of it:

```bash
wrangler pages deploy <build.dir>/<build.out> --project-name <project> --branch <branch>
```

Cloudflare Pages publishes that deployment at `<hash>.<project>.pages.dev` and aliases it
at `<branch-slug>.<project>.pages.dev`. Nothing is enabled per project, no DNS record is
written, and no certificate is ordered. ADR-0002 fixed the shape of the hostname; this
record fixes how it is produced and how long it lives.

## The four answers

| Question | Answer |
|---|---|
| What must a project have enabled for branch deploys? | Nothing. The project must exist, and that is all. Pages creates the alias for whichever branch a deployment names. |
| How does `/` in a branch name become an alias? | The alias is lowercased and every non-alphanumeric character becomes `-`: `feature/deploy-pipeline` deploys and is served at `feature-deploy-pipeline.<project>.pages.dev`. |
| What happens to an alias when its branch is deleted? | It keeps serving. Deleting a git branch is invisible to Pages; the alias still points at the newest deployment published for that branch name, and keeps serving until that branch name deploys again. A stale staging site therefore outlives its branch. |
| Is any per-project configuration needed? | No. The only per-project value is the project name, which comes from the Apps Registry. |

Two more answers the workflow ticket needs:

- **Staging is reachable without attaching a domain.** `pages.dev` hostnames always answer,
  over HTTPS, on Cloudflare's own certificate. Staging costs no `csete.cc` DNS label, no
  Universal SSL coverage (ADR-0001's one wildcard level is untouched) and nothing to
  rotate.
- **`main` is never passed as the branch for a staging deploy.** `--branch=main` is the
  production deployment, so it would move `<slug>.csete.cc` instead of the branch alias.
  `resolveTarget().deploy()` in `scripts/lib/targets.mjs` already refuses to describe a
  staging deploy without a branch under test, and it overwrites `main` with the branch
  for staging.

## Why the branch build settings do not apply

Pages has project settings for preview deployments — *All non-production branches*,
*None*, or *Custom branches* with wildcards. Those govern which branches Pages **builds**
when it is connected to a git provider. These five Pages Apps are not connected to git: the
pipeline builds locally and uploads the artifact. Pages is not the builder, so the setting
has nothing to decide, and a project created by `wrangler pages create` deploys any branch
alias on request. This is the reason the whole ticket has no configuration step in it.

The alternative reading — connect each project to GitHub and let Pages build — is what the
ten retired workflows effectively were, one per project, and it moves the build out of the
pipeline that checks credentials before it (ADR-0003's reasoning applies in the same
direction: the build belongs where the registry and the pinned CLI are).

## Considered Options

- **A wildcard custom domain for staging** (`*.<project>.csete.cc`) — rejected: Universal
  SSL covers one label below `csete.cc`, so a wildcard-of-wildcard needs Total TLS, and
  Pages custom domains are attached one exact hostname at a time, not per branch.
- **A stable `dev` staging hostname** — already rejected in ADR-0002: it needs an
  integration branch, and staging then tests what has accumulated rather than what is under
  review.
- **The hash URL only** (`<hash>.<project>.pages.dev`) — rejected: the hash changes every
  deploy, so there is nothing to bookmark and nothing to send to a reviewer. The alias is
  the stable name; the hash URL stays available for pinning a specific build.
- **Deleting aliases after merge** — rejected: Pages has no operation for it. Deleting the
  deployment behind an alias needs `--force`, and the newest deployment for a branch cannot
  be deleted at all, so retention is not something a workflow can enforce.

## Consequences

- Two branch names that slug to the same label share one alias: `fix/api` and `fix-api`
  both deploy to `fix-api.<project>.pages.dev`, and the later deploy wins. Nothing guards
  this; rename the branch.
- The alias label is a DNS label, so DNS caps a branch slug at 63 characters — Pages
  documents no limit of its own. Both the `feature/` prefix and the project name are long,
  so a descriptive branch name can approach that cap; nothing enforces it, so keep branch
  names short.
- Staging sites are public and unauthenticated, and the alias is guessable from the branch
  name. If a specific App's staging must be private, that is Cloudflare Access in front of
  the alias — a separate decision, not a pipeline one.
- A merged-and-deleted branch leaves a working staging URL behind. Nothing retires it
  automatically; retiring it is a redeploy of that branch name or a project deletion.
- The staging hostname is never derived by the registry. `hostnameFor()` returns the
  production hostname only, so no staging URL can reach the registry, the Dashboard or the
  deploy matrix.
- The first deploy on a branch is what creates its alias, so a branch has no staging URL
  until the pipeline has run for it once. A failing first run leaves the branch with no
  alias rather than a broken one.
