# Implementation phase plan 2

Use this doc to track progress. Mark status per task:
- [ ] not started
- [~] in progress
- [x] done

## Phase 0: planning inputs
- [x] Confirm feature flag behavior for Option A vs Option B selection.
- [x] Confirm completion list scope (admin-only vs purchaser-only vs both).
- [x] Confirm question set definitions and question content.
- [x] Confirm quiz concurrency policy and messaging copy.

## Phase 1: documentation
- [x] Create developer setup guide (install, env, Supabase setup, run).
- [x] Create test guide (Playwright commands, artifacts, replay).
- [x] Update README to link to new docs.

## Phase 2: data model and Supabase
- [x] Add question sets, question options, and reveal-to-set mapping.
- [x] Seed three predefined question sets and questions.
- [x] Support single-select answers for the lights-off set.
- [x] Persist quiz start timestamps and lock ownership for concurrency.

## Phase 3: question set selection flow
- [x] Implement feature flag to toggle Option A vs Option B.
- [x] Create selection screen for the three question sets.
- [x] Ensure quiz link is created after set selection in Option B.
- [x] Persist selection to Supabase and display on dashboard.

## Phase 4: completed quiz review
- [x] Build completed quiz list screen for admin.
- [ ] (Optional) Build completed quiz list for purchaser view.
- [ ] Ensure list links to reveal details.

## Phase 5: quiz completion protection
- [x] Reject re-submission after completion.
- [x] Prevent parallel quiz starts and block secondary tabs.
- [x] Show friendly lock/started/completed states on quiz page.

## Phase 6: sharing + intro UX
- [x] Add share button next to copy in the magic link panel.
- [x] Add optional email send section behind a feature flag.
- [x] Add quiz welcome screen before questions begin.
- [x] Add goodbye screen with submission confirmation.
- [x] Implement focus order rules for inputs and buttons.
- [x] Default-select first option for single-select questions.

## Phase 7: admin KISS improvements
- [x] Simplify admin home into a single panel layout.
- [x] Add reveal search by purchaser email or reveal id.
- [x] Ensure read-only defaults with explicit edits.

## Phase 8: feedback capture
- [x] Add a feedback modal or section for scoring/praise.
- [x] Persist feedback and surface it in admin view.

## Phase 9: testing
- [~] Expand Playwright coverage for all question sets.
- [~] Add tests for quiz locking and completed-link behavior.
- [x] Add tests for share button and email send flow.
- [~] Add tests for intro screen and focus order.
- [x] Add tests for admin completed list and review.
- [x] Add tests for feedback submission and admin visibility.
- [ ] Verify Playwright artifacts are recorded and replayable.


 Documented the decisions and kept moving. Question sets, selection flow, quiz locks, single‑select UX, admin
  completed list, and feedback capture are now wired end‑to‑end with migrations and updated tests.

  - New question set data + seed mapping: src/lib/questions.ts, src/lib/data/memory.ts, src/lib/data/supabase.ts
  - New schema changes: supabase/migrations/0002_question_sets.sql, supabase/migrations/0003_feedback.sql
  - Selection flow (Option A/B) + quiz lock + welcome/goodbye: src/app/question-sets/page.tsx, src/app/quiz/
    QuizClient.tsx, src/app/api/reveals/[id]/quiz/start/route.ts, src/app/api/reveals/[id]/question-set/route.ts
  - Feedback capture + admin visibility: src/components/FeedbackForm.tsx, src/app/api/feedback/route.ts, src/app/api/
    admin/feedback/route.ts, src/app/admin/AdminClient.tsx, src/app/reveal/[id]/page.tsx
  - Admin completed list + search: src/app/admin/AdminClient.tsx
  - Decisions updated: dualreveal/docs/implementation-plan/decisions.md
  - Playwright coverage expanded: tests/e2e/flow.spec.ts, with playwright.config.ts setting ADMIN_TOKEN
  - Option B selection refresh + lock per tab: src/app/question-sets/QuestionSetClient.tsx, src/app/quiz/QuizClient.tsx,
    src/app/dashboard/[id]/page.tsx

  Notes

  - question_set_flow enabled => Option B (selection after purchase) is honored and documented.
  - Question set selection is now locked once chosen on a reveal.
  - Admin list is admin‑only and links to reveal details.
  - Supabase migrations 0002_question_sets + 0003_feedback applied; seed confirmed (3 sets, 24 questions, 32 options).
  - Quiz lock now scopes to a single tab session to block secondary tabs.
  - Question set selection returns to the dashboard with a full reload to avoid stale cache.

  Tests: npm run test (pass).

  If you want me to continue, the natural next steps are:

  1. Decide whether to finish the remaining admin layout simplification + the missing Playwright checks (share/email,
     feedback admin view, admin completed list).

----

• Applied the Supabase migrations and seeded the question sets, then fixed the two Playwright failures by avoiding
  stale dashboard data after selection and scoping the quiz lock to a single tab; the phase plan now reflects the
  completed steps.

  - Supabase: applied supabase/migrations/0002_question_sets.sql and supabase/migrations/0003_feedback.sql, seeded
    question data (3 sets, 24 questions, 32 options).
  - Option B selection now forces a full reload back to the dashboard to avoid cached data in src/app/question-sets/
    QuestionSetClient.tsx.
  - Dashboard rendering is forced dynamic in src/app/dashboard/[id]/page.tsx, and quiz lock now uses session storage to
    block secondary tabs in src/app/quiz/QuizClient.tsx.
  - Progress log updated in dualreveal/docs/implementation-plan2/phase-plan2.md.
  - Admin navigation now uses a left-side menu with anchored sections.
  - Welcome screen now highlights sender, question count, and recenters the card.
  - Text inputs auto-focus on each step and tab order favors Next after inputs.
  - Playwright config now records video/trace artifacts by default.

  Tests: npm run test (pass).

  Next steps

  1. Verify Playwright artifacts are recorded and replayable.

  ---
  Added a left-side admin menu and reorganized the admin screen into anchored sections, then updated the plan and admin
  KISS docs to match the new layout.

  - Admin layout: new header + sticky sidebar nav + section anchors across access, flags, content, and ops in src/app/
    admin/AdminClient.tsx.
  - Plan update: Phase 7 marked done and notes refreshed in dualreveal/docs/implementation-plan2/phase-plan2.md.
  - Doc update: admin UI improvements now describe the left-nav sections in dualreveal/docs/implementation-plan2/admin-
    kiss.md.

  Tests not run for this change.

  Next steps (pick one):

  1. I can sanity-check /admin in the browser for layout/scroll behavior.
  2. I can add/update Playwright coverage for admin navigation anchors if you want it automated.
 
 ---

 Improved the recipient flow to keep text inputs focused between steps, fixed tab order so Next comes
  right after the input, expanded the welcome copy, and ensured the progress box only appears after the
  quiz starts. I also enabled Playwright video/trace recording by default and updated docs.

  Changes

  - src/app/quiz/QuizClient.tsx: new welcome copy + layout, auto-focus on each step, and tab order with
    Next after inputs.
  - playwright.config.ts: video/trace/screenshot recording enabled.
  - Docs updated: docs/testing.md, dualreveal/docs/implementation-plan2/testing.md, dualreveal/docs/
    implementation-plan2/user-experience.md, dualreveal/docs/implementation-plan2/phase-plan2.md.

  Tests: npm run test (pass).

  Run tests + view video

  npm run test
  ls test-results
  open test-results/<test-name>/video.webm
  npx playwright show-trace test-results/<test-name>/trace.zip

  If you want a single test video:

  npx playwright test tests/e2e/flow.spec.ts -g "purchase to reveal flow"
  open test-results/flow-purchase-to-reveal-flow/video.webm

  ----

  Shipped the UX fixes around reveal completion and re-purchase flow, plus a tighter goodbye/feedback
  layout and added marketing copy on the purchase screen to push repeat reveals. Updated the flow docs
  and adjusted the e2e expectation to match the new dismissible feedback behavior.

  - New reveal creation now ignores completed reveals in src/app/api/reveals/route.ts, so “Start a new
    one” won’t route back to the old dashboard.
  - Dashboard polls for completion and closes the magic link when done, with a clear CTA to start a new
    reveal in src/app/dashboard/DashboardClient.tsx.
  - Goodbye screen is more balanced and feedback can be dismissed or auto-closes after submit via the
    compact/dismissible src/components/FeedbackForm.tsx + new layout in src/app/quiz/QuizClient.tsx.
  - Added purchase-page marketing copy in src/app/purchase/PurchaseClient.tsx.
  - Updated flow docs in dualreveal/docs/implementation-plan/02-user-flows.md and dualreveal/docs/
    implementation-plan2/flows.md.
  - Updated feedback assertion in tests/e2e/flow.spec.ts.