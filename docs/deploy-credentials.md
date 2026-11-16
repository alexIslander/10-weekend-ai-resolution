# Deploy credentials and environments

Names and rules only. No values live in this repository, and none may be added:
the credential is a Cloudflare API token held in GitHub Encrypted Secrets.

## Repository secrets

Stored at repository level, so both the `production` and `staging` environments can
read them. Environment-scoped secrets were rejected: the two environments use the
same credential, and duplicating it would let one copy drift or expire unnoticed.

| Name | Kind | Consumer |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | secret | `_deploy-app.yml` credential check and deploy step; `scripts/provision.mjs` |
| `CLOUDFLARE_ACCOUNT_ID` | secret | same |

`CLOUDFLARE_ACCOUNT_ID` is a secret rather than a repository variable on purpose:
`lit-starter-*.yml` already reads it through `secrets.`, and a variable/secret
split would leave one of the two consumers reading an empty string.

## Environments

| Environment | Reviews | Branch policy |
|---|---|---|
| `production` | required, one reviewer (`alexIslander`), self-review allowed | `main` only |
| `staging` | none | all branches |

`prevent_self_review` is **off**. The repository has one human account; leaving it
on would make every production deploy unapprovable and the gate would be bypassed
in practice rather than honoured.

## Cloudflare token

Account-owned token, name `gh-pages-deploy-10-weekend-ai-resolution`, expiring.

| Scope | Permission |
|---|---|
| Account | Cloudflare Pages: Edit |
| Zone `csete.cc` | Zone: Read |
| Zone `csete.cc` | DNS: Read |

`DNS: Edit` is deliberately absent, and the first real attach proved both halves
of that decision:

- **Pages does not create the CNAME itself.** Attaching `<slug>.csete.cc` by API
  succeeds and leaves the domain `pending` with `CNAME record not set`; the record
  has to exist before the hostname serves. So the deploy path still needs only
  read access, and DNS is a one-off per hostname, done with a token that has
  `DNS: Edit` (or by hand in the dashboard).
- **The CNAME target is not always `<slug>.pages.dev`.** The `rubik` project's
  pages.dev host is `rubik-7pp.pages.dev`, because the plain name was taken. Read
  `subdomain` from the project; never assemble the target from the App Slug.

The five production records, all proxied, are:

| hostname | CNAME target |
|---|---|
| `apps.csete.cc` | `10-weekend-ai-resolution.pages.dev` |
| `lit-starter.csete.cc` | `01-lit-starter.pages.dev` |
| `admin-starter.csete.cc` | `02-lit-admin-starter.pages.dev` |
| `rubik.csete.cc` | `rubik-7pp.pages.dev` |
| `rubik-game.csete.cc` | `rubik-game.pages.dev` |

Staging needs none of this: branch aliases answer on `pages.dev` with no record
and no certificate (ADR-0006).

The token is also deliberately narrower than the "Edit Cloudflare Workers" template:
no Workers Scripts, KV, R2, Tail or Routes permissions, and no all-zone scope.
`dualreveal` is `target: "workers"` and `resolveTarget()` refuses it, so nothing in
this repo deploys a Worker yet.

## Verifying a credential

`GET /user/tokens/verify` answers only for user-owned tokens. This token is
account-owned, so that call returns `1000 Authentication error` even when the token
is valid. Verify against the account instead:

```bash
curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/tokens/verify" \
  | jq -r '.result.status'
```

Expected `active`. The full preflight — token, zone, and conflicting DNS records —
is three such calls and exits non-zero on any failure.

## Rotation

1. Create the replacement token in the Cloudflare dashboard with the scopes above.
2. `gh secret set CLOUDFLARE_API_TOKEN --repo alexIslander/10-weekend-ai-resolution < /path/to/token`
3. Run the preflight to confirm the new token can read Pages, the zone and its records.
4. Delete the old token in the dashboard.

Never pass the value with `--body` on a command line: it lands in shell history and
in the process list. Standard input keeps it out of both.
