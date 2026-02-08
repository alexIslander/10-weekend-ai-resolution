# MCP workflows for coding agents

## Purpose
This guide suggests practical workflows for MCP servers available in this environment. Use it to accelerate implementation while keeping security and data minimization goals intact.

## Recommended flow
### 1) Data model and RLS first (supabase)
- Define tables for reveals, answers, coupons, coupon attempts, and feature flags.
- Create RLS policies to ensure only owners can access reveals and answers.
- Add minimal fields only, avoid unnecessary PII.
- Validate indexing for lookup by reveal ID and purchaser email.

### 2) Auth setup (supabase)
- Enable SSO providers or magic-link sign-in.
- Avoid password auth.
- Confirm auth hooks for linking reveals to user IDs when available.

### 3) Payments and coupons (stripe)
- Model Checkout sessions with server-side pricing.
- Implement coupon validation in the API route only.
- Configure campaign discount and personalized coupons.
- Plan webhook verification for session completion.

### 4) Feature flag and coupon abuse controls (supabase)
- Store campaign flag in a simple feature flags table.
- Track coupon attempts and enforce cooldowns and bans.
- Keep attempt keys minimal (email and hashed IP only).

### 5) UI implementation (context7)
- Pull up-to-date Next.js and Stripe patterns as needed.
- Use docs for Supabase client and server APIs.
- Keep a single source of truth for pricing on the server.

### 6) Architecture diagrams (mermaid)
- Generate a sequence diagram for purchase flow.
- Generate an ER diagram for the data model.
- Keep diagrams in `dualreveal/docs/implementation-plan/`.

### 7) QA and sandbox testing (stripe)
- Use Stripe sandboxes for isolated tests.
- Simulate events using test helpers or the Stripe CLI.
- Confirm no real money movement during tests.

## MCP server quick notes
- `supabase`: schema design, migrations, RLS policies, auth providers.
- `stripe`: checkout sessions, coupons, webhooks, and sandbox testing.
- `context7`: official docs and code examples for key libraries.
- `mermaid`: architecture and flow diagrams.
- `browsermcp`: optional UI smoke checks.
- `obsidian`: optional note sync, decision log.

## Safety guardrails
- Never log or store secrets in docs or code comments.
- Never trust client-side pricing or coupon validation.
- Use server-side checks for discounts, totals, and access control.
