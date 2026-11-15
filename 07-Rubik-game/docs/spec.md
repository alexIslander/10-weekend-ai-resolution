# Spec — Rubik trigger-recognition game

Published as issue #2 (`ready-for-agent`). Vocabulary: `docs/glossary.md`; decisions:
`docs/adr/0001`–`0004`.

## Problem Statement

I am learning to solve the Rubik's cube with the minimal OLL method in `06-Rubik/`. The
booklet tells me which trigger to apply to each of the 57 positions, but reading a table is
not the skill I lack: when I look at a real position on a real cube, I cannot tell quickly
whether it is a Sune, an Anti-Sune, an Edge Trigger or a Wide Edge Trigger. I need to
rehearse the *recognition* — position in, trigger out — until it is instant, and I need to
know which positions I keep getting wrong so I can rehearse those and not the ones I already
know.

## Solution

A small web game that shows one position diagram at a time and asks for the trigger, with
four options. Runs come in modes (random, grouped by booklet heading, progressive by step
count, full route, with-AUF, adaptive), each playable at one of two hint levels (Training
shows the case name, Test shows nothing until the answer). Every finished run produces a
score that lands on a board for its mode and hint level, under the name the player typed.
Every answer is recorded per position, and the stats page turns those records into a
weak-spot list, a per-group accuracy table, and an adaptive run that starts with the
positions I am worst at.

The game is a client-side single-page app with no server, no build step and no sign-in: the
player is a name, and the records live in the browser.

## User Stories

### Identity

1. As a player, I want to type my name before my first run, so that the score is attributed to me.
2. As a returning player, I want to type the name I used before, so that my stats and history continue.
3. As a player, I want to see whose name the current run is being recorded under, so that I never write into someone else's record by accident.
4. As a player sharing a device, I want to switch to another name at any time, so that two people's records stay separate.
5. As a player, I want the app to remember the last name used, so that starting again is one tap.

### Answering

6. As a learner, I want to see the position diagram large and uncropped, so that I can read the top face and the side ring.
7. As a learner, I want exactly four trigger options (S, AS, ET, WT), so that answering is a tap and not a typing exercise.
8. As a learner, I want the four options in a different order on every question, so that I learn the positions, not the button positions.
9. As a learner, I want immediate correct/incorrect feedback, so that a miss teaches me something in the moment.
10. As a learner, I want the correct trigger shown when I miss, so that I can replay the position in my head.
11. As a learner, I want the reveal to show the case name, the OLL number, the step count and the full route with its AUF turns, so that I can study the position after answering.
12. As a learner, I want a link from the reveal into the cube simulator at that exact position, so that I can play the route through on a real simulation.
13. As a learner at Training, I want the case name visible while I answer, so that I can connect the name to the picture.
14. As a learner at Test, I want no case name, OLL number, group or step count visible before I answer, so that a correct answer means real recall.
15. As a learner, I want to choose the hint level for a run, so that I can train and then test myself at the same mode.

### Modes

16. As a learner, I want a Random run over all 57 positions in shuffled order, so that I rehearse without the booklet's grouping helping me.
17. As a learner, I want to pick one of the 14 groups and run through exactly that group, so that I can drill "Lightning Bolts" alone.
18. As a learner, I want a Progressive run that goes one-step positions first, then two-step, then three-step, so that I build up difficulty.
19. As a learner, I want a Route run that asks for the whole sequence of triggers, so that I practise multi-step solving and not only the first step.
20. As a learner, I want an AUF run that asks for the setup turn as well as the trigger, so that I practise the turns between steps.
21. As a learner, I want an Adaptive run that starts with the positions I am worst at, so that my practice time goes where it pays.
22. As a first-time player with no history, I want Adaptive to fall back to Progressive order, so that the mode is not empty on day one.
23. As a player in a hurry, I want to stop an Adaptive run after the worst N positions, so that I can drill fifteen positions in five minutes.
24. As a learner, I want the mode and hint level of the run visible while I play, so that I know which record I am writing.

### Run mechanics

25. As a player, I want to see how far through the run I am, so that I know how much is left.
26. As a player, I want my score visible during the run, so that I can feel a streak building.
27. As a player, I want the streak multiplier to rise with consecutive correct answers and reset on a miss, so that a good run is rewarded.
28. As a player, I want a finish screen with score, correct count, accuracy and elapsed time, so that I can judge the run.
29. As a player, I want an abandoned run to be discarded rather than half-recorded, so that the boards stay honest.
30. As a player, I want the score I just earned to appear on its board without retyping my name, so that finishing a run flows into comparing it.

### Boards

31. As a player, I want one board per mode and hint level, so that a Training score is never ranked against a Test score.
32. As a player, I want each board row to show name, score and date, so that I can see who did what and when.
33. As a player, I want ties broken by elapsed time, so that the faster run of equal score ranks higher.
34. As a player, I want to see the board for the mode I just played straight after the run, so that the comparison is immediate.

### Stats

35. As a learner, I want per-mode accuracy and best score, so that I can see which mode I am strongest at.
36. As a learner, I want per-group accuracy over the 14 groups, so that I can see which family of positions I am weak at.
37. As a learner, I want the ten positions with the worst accuracy, with attempts, accuracy and when I last saw them, so that I know exactly what to practise.
38. As a learner, I want to drill a single position from that list, so that I can go straight at one stubborn case.
39. As a learner, I want a "practise my weak spots" button that starts an Adaptive run, so that the transition from insight to practice is one tap.
40. As a learner, I want lifetime totals (runs, positions answered, overall accuracy), so that I can see progress over weeks.
41. As a player, I want to reset my stats while keeping my name, so that I can start a clean slate.
42. As a player, I want to delete a player entirely, so that a name I no longer use leaves no record on the device.

### Platform

43. As a player, I want to play on my phone in portrait, so that I can practise anywhere.
44. As a player, I want tap targets big enough for a thumb, so that a fast run is not a mis-tap run.
45. As a player, I want the app to load from a local static server with one command, so that I can run it without a build toolchain.
46. As a maintainer, I want the position data as one generated, committed file, so that the game has no runtime dependency on the booklet project.
47. As a maintainer, I want to regenerate that file with one command, so that a change in the booklet is a reviewable diff.
48. As a maintainer, I want the scoring, ordering and priority rules covered by tests that need no browser, so that changing a formula is safe.

## Implementation Decisions

**Host app.** The bce.design template is copied into the project as-is — custom elements over
vendored lit-html, a Redux-style store (`configureStore` / `createAction` / `createReducer`),
the Navigation-API router, whole-state localStorage persistence, an import map and no build
step. The template's sample bookmarks bounded context is removed along with its route
registration, reducer registration, page title and Playwright specs.

**One pure core.** A browser-free quiz core owns every rule that decides *what happens*:
building a run (which positions, in which order), evaluating an answer, scoring it, and
ranking a position's priority for an Adaptive run. It is plain ESM with no DOM, no store and
no imports outside itself. Given the same cases, records and random source, it returns the
same run — the random source is injected, so runs are reproducible in tests. Components
render its output; controls dispatch its results; nothing re-implements a rule.

Core surface, conceptually:

- `buildRun(cases, mode, hintLevel, records, random)` → an ordered list of questions, each
  carrying the position and, per mode, what the answer must consist of.
- `answer(question, given, runProgress)` → outcome with correctness, points awarded, new
  streak, and whether the run is complete.
- `priority(record, now)` → the Adaptive ordering key.

**Position data.** A single generated JSON file in the app holds the 57 positions: OLL
number, case name, image reference, group, step count, and the route as an ordered list of
`{auf, trigger}`. It is produced by a generator script that reads the booklet's route
fixture for everything except the group names, which are scraped from the print guide's 14
headings in booklet order. The generator also copies the 57 position images into the app.
The generated file is committed and never hand-edited; regeneration is the only way to
change it.

**Modes.** Six, differing only in the ordered list they produce:

- Random — all 57, shuffled.
- Grouped — one group, its positions shuffled; group chosen before the run.
- Progressive — all 57, ordered by step count (the 4 one-step positions, then the 32
  two-step, then the 21 three-step), shuffled within each block.
- Route — all 57 shuffled; the answer is the complete sequence of triggers, entered as chips
  and submitted explicitly, all-or-nothing.
- AUF — all 57 shuffled; the answer is two parts, the AUF (`none` / `U` / `U'` / `U2`) then
  the trigger, both must be right.
- Adaptive — all 57 ordered by priority descending, with an optional stop after the worst N.

The first three ship first, then Route, then AUF, then Adaptive.

**Hint level.** Independent of mode: Training reveals case name and OLL number while asking;
Test reveals nothing identifying until the answer. Progressive defaults to Training, the
other modes to Test; the player can override per run. The reveal is identical at both levels.

**Scoring.** 10 points per correct answer multiplied by a streak multiplier that climbs
1 → 2 → 3 → 4 → 5 and caps there; a wrong answer resets it. Elapsed time breaks ties on a
board; there is no countdown.

**Priority.** A Laplace-smoothed error rate — `(wrong + 1) / (attempts + 2)` — combined with
staleness (days since last seen, capped at 30) as `0.7 × weakness + 0.3 × (1 − staleness)`.
Positions never seen land mid-table. The formula is the core's business; no component knows
it.

**Records.** One player record per name: per-position `attempts`, `correct`, `wrong`,
`lastSeenAt`, `streak`, plus one entry per finished run (`mode`, `hintLevel`, `score`,
`correct`, `total`, `startedAt`, `finishedAt`). Boards are derived from finished runs, not
stored twice. A name is identity, not authentication: typing an existing name adopts its
history.

**Persistence.** The template's single-key whole-state persistence is kept; players are
branches of the state map rather than separate keys. An in-progress run lives in the same
tree but is not scored unless finished; a reload mid-run may resume or restart it, and
neither outcome writes a score.

**Navigation.** `Play` (mode, hint level, name, group picker), `Stats`, `Scores`, and the
run view, following the template's route registration. English UI, portrait-first layout,
diagrams scaled but never cropped. *Superseded by ADR-0006:* `/` is a dashboard and the
picker expands inside the chosen mode's card.

## Testing Decisions

Good tests here assert what a player observes or what a rule guarantees, never how it is
wired: a test may say "an Adaptive run with no history orders positions as Progressive" or
"four correct answers in a row make the fifth worth 50 points", and must not reach into
component internals, action names or state shapes.

**Core (unit, `node --test`, no browser, no install).** Every mode's ordering, the shuffle
being seed-reproducible, the scoring ladder and its reset, the priority formula including
its never-seen and stale cases, the no-history fallback, Route all-or-nothing evaluation, AUF
both-parts-must-match, and the run completing exactly at pool size. This is the only new
seam the UI cannot bypass, so it carries the weight.

**Generator (unit, `node --test`).** 57 positions, unique OLL numbers, group sizes
(7, 2, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 8) summing to 57, step counts (4 / 32 / 21), every
route length equal to its step count, every AUF in the allowed set, and every image file
present.

**End-to-end (Playwright, against the local static server).** Prior art: the template's own
spec and `00-dualreveal/tests/e2e`. One throwaway-name run through a small group at Training
reaches the finish screen and leaves a row on that board; Test hides the case name until the
answer; the stats page shows a group row after the run; deleting the player empties their
board rows.

## Out of Scope

- PLL — its position images are not mapped (`pll_cases.json` names files that do not exist),
  and the four minimal PLL formulas are not part of the answer set.
- Intermediate positions of a multi-step route: only the diagram at the start of a position
  is quizzed, so no diagram rendering is needed.
- Authentication, accounts, synchronisation between devices, and any server.
- Deployment to a public host; the game runs from a local static server.
- Offline install / service worker, sound, animations, i18n other than English.
- Keyboard answering was out of scope here and has been promoted to a ticket of its own
  ([#11](tickets.md)): `1`–`4` answer the option in that position, and focus moves to the
  next button so `Enter` advances. It is sequenced after the modes and stats, and it never
  replaces mouse or touch or the `Tab` order.

## Further Notes

- The trap this project must not fall into: `friedrich-oll-NN.png` is not OLL case NN. The
  route fixture already resolves images to positions correctly, so the generator copies
  mappings as given and must never derive an image name from the OLL number.
- The 14 group names exist only in the booklet's print HTML; the generator scrapes them in
  booklet order, and the group sizes are asserted, so a silent reordering fails the build.
- The template's warning applies: Vite resolves the bare lit-html / Redux imports itself and
  breaks the import map, so the app is served statically, never bundled.
- The game is a bounded context of its own: quiz, players, and rendering are three
  responsibilities; keep the core free of all three's concerns.
