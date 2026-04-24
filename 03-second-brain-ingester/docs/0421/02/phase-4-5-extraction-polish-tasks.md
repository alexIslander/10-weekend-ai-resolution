# Phase 4.5 extraction polish tasks

This checklist tracks the narrow follow-up slice after Phase 4 runtime verification turned green on the approved narrative PDF but left small extraction-quality defects that are still visible in the output.

## Phase 4.5: Extraction polish and reviewability cleanup

- Target: reduce the remaining low-signal extraction defects without reopening ingest, chunking, or orchestration work.
- Phase gate: the approved narrative PDF real-model path now completes successfully, and the bounded short technical native Ollama smoke path is green.
- Phase output: cleaner extraction normalization, cleaner verification ergonomics, and one short before/after note under `docs/0421/02/`.
- Phase 4.5 status: ready to start.
- Local checkpoint:
  use the current native `Ollama.app` path and the existing Phase 4 branch context as the starting point unless a separate review branch is created for this polish slice.
- [ ] Keep this slice extraction-only plus the smallest verification-workflow cleanup:
  no loader changes,
  no chunking changes,
  no routing changes,
  and no orchestration expansion.
- [ ] Fix title normalization defects visible in the current narrative rerun:
  remove merged-word artifacts such as `Neuralcoupling`,
  and keep concept titles deterministic after normalization.
- [ ] Reduce obvious duplicate concept notes created by near-identical extracted titles or summaries when they point to the same local idea in the same run.
- [ ] Clean related-link output just enough to remove clearly placeholder or malformed links:
  empty links,
  generic invented links,
  and malformed local anchors should not survive unchanged into final note bodies.
- [ ] Normalize markdown section structure so generated note bodies use one consistent heading shape.
- [ ] Fix the smallest progress-output defect visible in recent runs:
  investigate the brief `Page 1 k 6` or `Ch6` title glitches and keep status output stable.
- [ ] Fix the bounded qwen3 technical Devbox smoke path so it writes to its own distinct output directory rather than reusing the older `02-...` path.
- [ ] Add only the focused tests needed for this slice:
  one title-normalization regression,
  one duplicate-suppression regression,
  one related-link cleanup regression,
  one note-body heading normalization regression,
  and one bounded workflow assertion where practical.
- [ ] Update `devbox.json` and `README.md` together if any workflow command or output-path contract changes.
- [ ] Verification:
  `devbox run phase-4-extraction-test`
  plus one bounded narrative rerun:
  `devbox run app-anyone-chapter-pdf-ollama`
  plus one bounded technical qwen3 rerun:
  `devbox run 03-head-first-sa-chapter-short-txt-ollama-smoke-qwen3`
- [ ] Write one short before/after extraction-polish note under `docs/0421/02/` with:
  one duplicate-title example,
  one related-link cleanup example,
  one markdown-structure cleanup example,
  and one statement on whether note usefulness stayed at least as strong as the current Phase 4 output.
- [ ] Exit gate:
  title cleanup is visibly better,
  duplicate note noise is lower,
  related links are no longer obviously placeholder-like in the reviewed sample,
  markdown sections are consistent,
  the qwen3 bounded smoke path writes to a distinct output location,
  and both the narrative and bounded technical fixtures remain useful by the rubric.

## Hold line

- [ ] Do not reopen PDF ingest work from this task file.
- [ ] Do not reopen chunking work from this task file.
- [ ] Do not add new provider, routing, or cloud-fallback behavior from this task file.
- [ ] If the cleanup harms note usefulness on either verification fixture, stop and record that tradeoff before expanding scope.
