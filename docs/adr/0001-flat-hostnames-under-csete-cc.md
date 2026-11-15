# Flat hostnames under csete.cc for all monorepo deployments

Every App is served at `<slug>.csete.cc` and the Dashboard at `apps.csete.cc` — one DNS
label below the apex — rather than a nested namespace such as `<slug>.apps.csete.cc`.

The reason is certificate coverage. The zone's only certificate pack is Universal SSL,
which covers `csete.cc` and `*.csete.cc`: exactly one wildcard level. A third-level
hostname like `rubik.apps.csete.cc` is not covered and would need Total TLS or Advanced
Certificate Manager. Nested hostnames read better but cost a paid feature to serve over
HTTPS, so the tidier namespace is not worth it.

## Considered Options

- **Nested (`<slug>.apps.csete.cc`)** — cleaner namespacing, and keeps the monorepo's
  Apps visually separate from the private homelab hostnames (`home`, `casaos`,
  `jellyfin`, `torrent`). Rejected: needs a paid certificate feature.
- **Path routing, one Pages project** (`apps.csete.cc/rubik`) — one certificate, one
  project, no per-App DNS. Rejected: every App rebuilds together in a single deployment,
  so per-App rollback disappears, and each App needs its asset base rewritten to its
  subpath.
- **Path routing, separate projects behind a router Worker** (`apps.csete.cc/rubik`
  proxied to the `rubik` project) — keeps independent deploys. Rejected on two counts:
  every App still needs a subpath asset base and SPA fallback rules, and all Apps would
  share one origin, so `localStorage`, cookies and CORS stop being isolated per App. It
  also breaks per-branch staging outright, since a single deployment then carries every
  App at once.
- **Path aliases in front of the subdomains** (a redirect Worker mapping
  `apps.csete.cc/rubik` to `rubik.csete.cc`) — not rejected; deferred. It costs one small
  Worker and no per-App configuration, so it stays available if a single shareable URL
  is ever wanted.

## Consequences

- New Apps must not collide with existing `csete.cc` hostnames. Taken today: the apex,
  `home`, `casaos`, `jellyfin`, `torrent`, `isl-ui`, and `apps`.
- Moving to a nested namespace later means buying Total TLS or ACM and re-pointing every
  custom domain.
- The apex `csete.cc` is already bound to `personal-page`, so the Dashboard cannot live
  there; `apps.csete.cc` is its home.
