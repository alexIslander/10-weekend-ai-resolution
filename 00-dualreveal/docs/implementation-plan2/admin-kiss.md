# Admin KISS feature set

## Core admin scope (minimal, high value)
- Completed reveals list with filters (status, date range, question set).
- Reveal detail view (read-only answers, metadata, timestamps).
- Question set editor (edit prompts, reorder, toggle active).
- Feature flag toggles (question set flow, email send, campaign discount).
- Coupon creation/revoke (basic controls only).

## UI improvements (still KISS)
- Left-side navigation with anchored sections for quick scanning.
- Single admin home with grouped panels: Access, Flags, Questions, Coupons, Reveals, Completed, Feedback, Retention.
- Quick search by purchaser email or reveal id.
- Simple CSV export for completed reveals (optional future).
- Inline success/error toasts, no complex dashboards.

## Guardrails
- Read-only by default; edits are explicit and logged.
- Clear "Last updated" timestamps.
