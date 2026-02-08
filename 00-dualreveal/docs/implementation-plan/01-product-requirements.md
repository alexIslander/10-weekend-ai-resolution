# Product requirements

## Problem statement
Couples often struggle to surface unspoken wishes. DualReveal provides a private, guided quiz that turns those wishes into a shared reveal for the purchaser.

## Primary personas
- Purchaser: wants insight into partner wishes and a simple, private experience.
- Respondent: receives a magic link, answers questions once, expects privacy.
- Owner/admin: manages pricing, questions, and operations.

## Goals
- Deliver a low-friction flow from purchase to reveal.
- Preserve privacy and trust throughout the experience.
- Ship a polished, consistent UI across desktop and mobile.

## Functional requirements
- Landing page explains the product and drives purchase.
- Purchase flow accepts email, creates a reveal, and redirects to dashboard.
- Dashboard lets purchaser name the reveal and copy the magic link.
- Quiz flow collects respondent name and answers 8 questions.
- Reveal page shows answers in a readable, celebratory format.
- Admin page manages questions and inspects reveals.
- Re-entry behavior supports returning purchasers by email.
- Coupon code supports time-limited and personalized discounts.
- Campaign discounts are gated by a feature flag.
- Coupon entry is always visible in the purchase UI.
- Coupon validation and pricing are enforced server-side.
- Coupon attempts are rate-limited with cooldown and ban.

## Non-functional requirements
- Mobile-first responsive layouts.
- Accessible controls and readable contrast.
- Fast initial load and clear loading states during hydration.
- Private data handling with minimal retention.
- Clear error states for invalid or completed links.
- Prefer SSO or magic-link login, no password storage.
- Server-side validation for pricing, coupons, and access control.

## Pricing and packaging
- Single purchase SKU with a simple price point (example in screenshots: $9.99).
- Optional future packages: bundles, gift cards, or subscriptions.

## Assumptions
- MVP can rely on client persistence, but production should use a real database.
- Magic link access is guarded by a long, unguessable ID.
- Payments are via Stripe Checkout with webhook verification.
- Supabase is the primary backend for storage and auth.

## Out of scope for MVP
- Multi-language support.
- Advanced analytics segmentation.
- Automated email delivery with templates.
- Refund management and customer portal.
