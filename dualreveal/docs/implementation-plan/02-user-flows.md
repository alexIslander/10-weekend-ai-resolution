# User flows

## Landing to purchase
- User lands on homepage.
- Primary CTA routes to purchase.
- Secondary CTA links to how-it-works section.

## Purchase to dashboard
- Purchaser enters email.
- Purchaser can enter a coupon code at any time.
- System checks for existing reveal by email.
- If found, redirect to existing dashboard.
- If new, create reveal and route to dashboard.

## Dashboard to quiz
- Purchaser sets reveal name.
- Purchaser copies magic link.
- Status panel shows waiting state until submission.

## Respondent quiz
- Respondent opens magic link.
- Intro asks for respondent name.
- 8 question flow with progress indicator.
- Submit completes quiz and locks link.
- Completed state shows confirmation message.

## Reveal view
- Purchaser sees completed status.
- View reveal shows each question and answer.
- Footer encourages next reveal or return to dashboard.

## Edge cases
- Invalid link: show friendly error and return home.
- Already completed: show completion state.
- Hydration delay: show loading state before validation.
- Payment failure: return to purchase with error.
- Invalid coupon: show error and attempts remaining.
- Too many coupon attempts: show cooldown or ban message.

## Event tracking (minimal)
- View landing, click CTA, start purchase.
- Purchase success, dashboard created.
- Magic link opened, quiz started, quiz submitted.
- Reveal viewed.
