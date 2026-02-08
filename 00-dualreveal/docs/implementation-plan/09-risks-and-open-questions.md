# Risks and open questions

## Open questions
- What is the source of truth for reveal data in production?
- Is respondent identity required beyond a first name?
- Should magic links expire or be revocable?
- What refund policy is required?
- Are there regional privacy requirements to honor?
- Which SSO providers are required on day one?
- What cooldown and ban durations should be enforced for coupon abuse?

## Risks
- Client-only persistence can lose data across devices.
- Unverified payments could allow free reveals.
- Magic link exposure risks unintended access.
- Copy failures on older browsers could block sharing.
- Coupon leakage or brute force could undermine pricing.

## Mitigations
- Move storage to a database before launch.
- Require webhook verification for completed status.
- Use long random IDs and optional PINs.
- Add robust copy fallback and inline feedback.
- Use feature flags and server-side pricing validation.
- Limit coupon attempts, add cooldown, and ban on abuse.

## Dependencies
- Stripe account and webhook configuration.
- Email provider if automated link delivery is required.
- Legal review for privacy and terms.
- Supabase project and auth provider setup.
