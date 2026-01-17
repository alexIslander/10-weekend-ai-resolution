# Backend and payments

## API routes
- `POST /api/checkout`
  - Create Stripe Checkout session.
  - Accept purchaser email and reveal metadata.
  - Accept optional coupon code at any time.
  - Return redirect URL or error.
- `POST /api/webhooks/stripe`
  - Verify checkout completion.
  - Mark reveal as paid and valid.

## Payment flow
- Client calls checkout API with email.
- Client includes coupon code when present.
- Redirect to Stripe Checkout.
- Stripe redirects to `/purchase/success`.
- Success page verifies session and creates reveal.

## Environment variables
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_BASE_URL`

## Data verification
- Use webhook for source of truth on payment.
- Store Stripe session ID to prevent replay.
- Idempotent processing on webhook events.
- Validate final amount server-side before session creation.
- Reject coupon codes when invalid or expired.
- Enforce coupon attempt limits with cooldown and ban after 10 tries.

## Email notifications (optional)
- Send magic link to respondent.
- Send completion notice to purchaser.
- Use an email provider when moving past MVP.

## Coupon campaigns
- Represent campaign state in a feature flag (env or config table).
- Define a single active campaign discount with fixed percent discount.
- Do not trust client pricing; compute final amount in the API route.
- Support personalized coupons alongside campaign discounts.
