# Staging is per branch; there is no integration branch

A deployment built from any branch other than `main` is a staging deployment and lands at
`<branch>.<project>.pages.dev`. `main` is production and ships to `<slug>.csete.cc` on
merge. The repo keeps its existing `feature/*` → `main` shape.

The alternative is an integration branch (`develop`) that owns a stable staging hostname,
with promotion as a PR to `main`. That was rejected because it adds a merge step the
repo has never had, and because the branch someone is actually testing is the branch they
are working on — not whatever has accumulated on an integration branch.

## Considered Options

- **`develop` branch + `dev.<project>.pages.dev`** — one bookmarkable staging URL.
  Rejected: extra branch and merge step, and staging drifts from what is under review.
- **Separate `<slug>-dev` project per App** — cleanest conceptual separation, but doubles
  the project count and lets staging configurations diverge from production silently.

## Consequences

- There is no single canonical staging URL. Staging is identified by branch, which is the
  thing under test.
- Long branch names produce long hostnames, and `/` in a branch name becomes `-` in the
  Pages alias.
- Promoting to production is a merge to `main`, not a redeploy of the tested artifact.
  The production deployment is rebuilt from the merged commit.
