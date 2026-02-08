# Testing and Playwright artifacts

## Required coverage
- Full flow per question set (current, communication, lights-off).
- Option A vs Option B selection flows (feature flag toggled).
- Quiz concurrency: second tab/window blocked.
- Completed quiz behavior: re-open link should show completed/locked state.
- Completed list screen (admin-only and/or purchaser-only).
- Magic link share button and optional email send panel.
- Quiz welcome screen and focus order behavior.

## Playwright recordings
- Configure traces, videos, and screenshots in Playwright config.
- Artifacts are stored in `test-results` by default.
- Replay traces with:
  - `npx playwright show-trace test-results/<test-name>/trace.zip`
- Replay videos with:
  - `open test-results/<test-name>/video.webm`

## Notes
- If artifacts are enabled on failure or retry, document that policy in the
  developer testing guide.
- Admin completed list, share/email, and feedback visibility are covered in
  `tests/e2e/flow.spec.ts`.
