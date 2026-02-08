# Implementation phase plan

Use this doc to track progress. Mark status per task:
- [ ] not started
- [~] in progress
- [x] done

## Phase 0: scope and decisions
- [~] Confirm Supabase project and environments (dev, prod).
- [x] Choose SSO providers (Google, Apple, magic link).
- [x] Define data retention window and deletion policy.
- [x] Decide coupon cooldown and ban durations.
- [x] Confirm campaign flag ownership (env vs table).

## Phase 1: foundation
- [x] Set up Supabase schema (reveal, answer, coupon, attempts, flags).
- [~] Create RLS policies and test access paths.
- [~] Configure auth providers and redirect URLs.
- [~] Create server utilities for Supabase and Stripe.
- [x] Establish env var handling and secrets policy.

## Phase 2: core user flow
- [x] Landing page content and CTAs.
- [x] Purchase form with email + coupon input.
- [x] Dashboard reveal management (name, status, magic link).
- [x] Quiz flow with progress and submission.
- [x] Reveal view layout with answers.
- [x] Persist and fetch reveal data from Supabase.

## Phase 3: payments and verification
- [ ] Implement `/api/checkout` with server-side pricing.
- [ ] Validate coupon codes and campaign discounts.
- [ ] Enforce coupon attempt limits, cooldowns, and bans.
- [ ] Implement Stripe webhook handler.
- [ ] Connect success page to webhook-verified state.

## Phase 4: admin and content
- [x] Admin dashboard for reveals list.
- [x] Admin editor for question set.
- [x] Admin controls for campaign flag.
- [x] Create and revoke personalized coupons.
- [x] Audit logging for admin edits.

## Phase 5: polish and security
- [x] Accessibility pass for forms and buttons.
- [x] Validate contrast and focus states.
- [x] Error states for invalid link and coupon abuse.
- [x] Ensure all pricing and access checks are server-side.
- [x] Add rate limiting for sensitive endpoints.

## Phase 6: testing and release
- [~] Manual end-to-end run with test data.
- [ ] Stripe sandbox testing and webhook simulation.
- [~] Regression tests for coupon behavior.
- [ ] Verify RLS rules with multiple users.
- [ ] Prepare deployment checklist and monitoring.
