# Architecture and data

## Proposed stack
- Next.js (App Router) with TypeScript.
- Tailwind CSS for styling.
- Supabase for database and auth.
- Client state via Zustand for UI state only.
- Stripe for payments.

## Core entities
- Reveal
  - id
  - purchaserEmail
  - purchaserUserId (nullable)
  - name
  - status (draft, awaiting, completed)
  - createdAt
  - completedAt
- Respondent
  - displayName
- Question
  - id
  - prompt
  - order
- Answer
  - questionId
  - response
- Coupon
  - code
  - percentOff
  - active
  - expiresAt
  - maxRedemptions
  - redemptions
- CouponAttempt
  - key (email or hashed IP)
  - attempts
  - cooldownUntil
  - bannedUntil
- FeatureFlag
  - key
  - enabled
  - updatedAt

## Storage strategy
- MVP: persisted client store to unblock flow.
- Production: database-backed storage with server-side access.
- Migration plan: mirror the client schema in the database to ease transition.
- Target: Supabase Postgres with row-level security.

## Link security
- Use long, random reveal IDs.
- Do not expose purchaser email in URLs.
- Optional: add reveal PIN or email verification.

## Security controls
- Enforce server-side pricing and coupon validation.
- Apply rate limits on coupon attempts by email and hashed IP.
- Use Supabase RLS to restrict access to reveals and answers.

## Hydration and consistency
- Gate all reveal lookups on hydration completion.
- Display a loading state before validation.
- Prefer immutable updates to avoid stale view state.

## Logging and observability
- Log checkout session creation and webhook events.
- Capture quiz submit failures and invalid link hits.
- Audit admin edits to questions and coupon campaigns.

## Auth approach
- Prefer SSO or magic-link sign-in, no password management.
- Supabase Auth providers (Google, Apple, email magic link).
- Store only the minimal identity fields required for receipts and support.

## Data minimization
- Keep purchaser email, reveal ID, and timestamps.
- Avoid storing respondent identifiers beyond display name.
- Purge completed reveals after a defined retention window.
- Store only hashed IP for rate limiting, with short retention.
