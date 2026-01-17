# Frontend implementation

## Route map
- `/` landing and how-it-works.
- `/purchase` email entry and purchase CTA.
- `/purchase/success` post-payment handling.
- `/dashboard/[id]` purchaser management.
- `/quiz/[id]` respondent flow.
- `/reveal/[id]` completed reveal view.
- `/admin` owner tools and question editing.

## Shared UI primitives
- Button, input, card, status panel.
- Progress bar with step count.
- Toast or inline message for copy errors.

## Page details
- Landing
  - Hero, benefits, how-it-works.
  - CTA to purchase.
- Purchase
  - Email input with validation.
  - Coupon code input always visible.
  - Inline discount preview and final price.
  - Show validation result, attempts remaining, and cooldown state.
  - Detect existing reveal by email.
  - Processing state and error handling.
- Dashboard
  - Editable reveal name.
  - Magic link display and copy.
  - Status panel with CTA when completed.
- Quiz
  - Intro step for respondent name.
  - 8-step question flow with progress.
  - Submit and completion state.
- Reveal
  - Display each question and answer in cards.
  - Footer guidance and return CTA.
- Admin
  - List reveals with filters.
  - Edit question set and save changes.

## State handling
- Persist store for UI fallback, but treat Supabase as source of truth.
- Maintain a hydrated flag to gate routing decisions.
- Keep quiz form state local until submit.

## Error states
- Invalid or expired link.
- Duplicate purchase email.
- Payment failure or cancel.
- Copy-to-clipboard failures.
- Invalid coupon, cooldown, or ban.
