# Architecture and data

## Proposed stack
- Next.js (App Router) with TypeScript.
- Tailwind CSS for styling.
- Client state via Zustand with persistence.
- Stripe for payments.
- Supabase for database

## Core entities
- Reveal
  - id
  - purchaserEmail
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

## Storage strategy
- MVP: persisted client store to unblock flow.
- Production: database-backed storage with server-side access.
- Migration plan: mirror the client schema in the database to ease transition.

## Link security
- Use long, random reveal IDs.
- Do not expose purchaser email in URLs.
- Optional: add reveal PIN or email verification.

## Hydration and consistency
- Gate all reveal lookups on hydration completion.
- Display a loading state before validation.
- Prefer immutable updates to avoid stale view state.

## Logging and observability
- Log checkout session creation and webhook events.
- Capture quiz submit failures and invalid link hits.
