# Quiz concurrency and lock policy

## Goal
Only one active quiz session per reveal. If the quiz is already started, reject
new sessions with a friendly message. Only one completion allowed.

## Server-side plan
- On quiz start:
  - If `quiz_started_at` is null, set it and store a lock owner.
  - If `quiz_started_at` is set and lock owner differs, return 409 with
    a friendly message.
- On submit:
  - If status is completed, return 409.
  - If lock owner differs, return 409.
- Clear lock on completion.

## Client-side plan
- When quiz page loads, call a `start` endpoint that reserves the lock.
- If lock fails, show a friendly "quiz already in progress" screen.
- On completion, disable submit buttons and show completion state.
