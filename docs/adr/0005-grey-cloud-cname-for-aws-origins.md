# AWS-hosted projects use a grey-cloud CNAME, not a proxied one

An AWS origin is reached through a DNS-only CNAME at `<slug>.csete.cc`, with TLS
terminated at AWS using an ACM certificate validated by a record in the `csete.cc` zone.

Proxying through Cloudflare (orange cloud) would terminate TLS for free with the existing
Universal SSL certificate, but Cloudflare forwards the public `Host` header to the origin,
so the AWS service still needs a matching certificate or listener rule to accept
`<slug>.csete.cc` — and its security group must allow Cloudflare's address ranges. Grey
cloud avoids the Host-rewrite problem and double TLS entirely, at the cost of Cloudflare's
cache and WAF for that hostname.

## Consequences

- ACM validation is a DNS record in a zone already owned here, so issuing the certificate
  is not a blocker.
- Moving a specific hostname to orange cloud later is a per-hostname DNS change, not a
  registry or workflow change.
- AWS origins see real client IPs, so IP-based rules on the AWS side behave as expected.
