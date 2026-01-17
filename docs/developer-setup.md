# Developer setup

## Prerequisites
- Node.js 18+ and npm.
- A Supabase project if you want persistent storage (optional for local).

## Install dependencies
- `npm install`

## Environment setup
- Copy `.env.example` to `.env.local`.
- Fill in the Supabase values if you want database-backed storage:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Optional settings:
  - `ADMIN_TOKEN` to access `/admin` without SSO.
  - `ADMIN_EMAILS` (comma-separated) to allow Supabase-authenticated admins.
  - `NEXT_PUBLIC_BASE_URL` for absolute links.
  - Pricing and retention settings in `.env.example`.

If Supabase is not configured, the app falls back to an in-memory store.

## Supabase setup
- Create a new Supabase project.
- Open the SQL editor and run the migration in `supabase/migrations/0001_dualreveal_schema.sql`.
- Copy the project URL and API keys into `.env.local`.

## Run the app
- `npm run dev`
- Visit `http://localhost:3000`.

## Admin access
- Visit `/admin`.
- Use the `ADMIN_TOKEN` value or sign in with an email in `ADMIN_EMAILS`.
