# Testing and release

## Manual test script
- Visit landing page and confirm CTA.
- Complete purchase with test email.
- Verify redirect to dashboard.
- Name reveal and copy magic link.
- Open magic link and complete quiz.
- Confirm dashboard status updates.
- View reveal and confirm answers render.
- Enable coupon campaign and verify discounted price.
- Disable campaign and confirm campaign discount is not applied.
- Confirm coupon field remains visible when campaign is off.
- Fail coupon validation 10 times and confirm cooldown and ban behavior.
- Make use of browser MCP
- Tests should be automated with Playwright

## Automated tests
- Component tests for form validation.
- Route tests for invalid and completed links.
- API tests for checkout and webhook handlers.
- Feature-flag tests for coupon flow.
- Playwright e2e tests live in `tests/e2e` and run via `npm run test`.

## Stripe sandbox testing
- Use Stripe sandboxes for isolated payment testing.
- Simulate events with test helpers or the Stripe CLI.
- Create separate sandboxes for teams or external partners.
- Invite external users to a sandbox without live-mode access.
- Note limitations: no IC+ pricing tests, no sandbox-to-sandbox Connect links.

## Release checklist
- Configure Stripe keys in deployment.
- Confirm webhook endpoint reachable.
- Validate mobile layouts for all routes.
- Check accessibility with keyboard only.
- Add monitoring and error tracking.
- Verify data retention and privacy copy.
- Validate SSO provider settings in Supabase.
