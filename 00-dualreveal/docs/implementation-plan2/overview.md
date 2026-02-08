# Phase 2 overview

## Scope
This phase improves documentation, testing, question-set selection, completed-quiz
review, and quiz concurrency protection. Payments remain out of scope.

## Key decisions
- Question set selection supports both Option A and Option B behind a feature flag.
- Option B requires the quiz link to be generated only after selection.
- Lights-off question set uses single-select answers (multi-select is a future feature).
- Global retention window (30 days) with a visible expiration date.
- Editing a question set after purchase is a future feature.
- Quiz concurrency: only one active quiz session allowed per reveal.
- Purchasers see the last 3 completed reveals (more via future subscription plan).
- All email sending is a future feature behind a feature flag.

## Feature flag behavior
- `question_set_flow` flag toggles between Option A and Option B.
- Option A: selection occurs before purchase.
- Option B: selection occurs after purchase; quiz link is created after selection.
