# Decisions and defaults

## Supabase environments
- Use a single Supabase project with separate keys for dev and prod.
- The app expects a service role key for server-side operations.

## Auth providers
- Default to magic-link email for admin access.
- Add Google and Apple SSO when Supabase providers are enabled.

## Data retention
- Completed reveals are eligible for purge after 90 days.
- Manual purge endpoint is available at `/api/admin/retention/purge`.

## Coupon abuse policy
- Attempts per email: 10
- Cooldown starts after 3 failed attempts and lasts 30 minutes.
- Ban after 10 failed attempts and lasts 24 hours.

## Campaign discount ownership
- Campaign discount is stored in the `feature_flags` table under the
  `campaign_discount` key with `config.percentOff`.
