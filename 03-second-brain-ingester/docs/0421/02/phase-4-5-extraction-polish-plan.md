# Phase 4.5 extraction polish plan

## First real value

Phase 4.5 closes the gap between "useful but messy" and "review-safe enough to keep with light editing" on the same already-approved fixtures.

- Real input:
  the approved narrative PDF fixture and the bounded short technical `.txt` fixture
- Real output artifact:
  one durable before/after extraction-quality note under `docs/0421/02/` plus cleaner markdown notes written to disk
- Verification:
  rerun the narrative PDF real local path and the bounded short technical real-model path, then compare the resulting notes against the Phase 4.5 acceptance criteria
- Manual quality verdict:
  duplicate titles, malformed related links, and inconsistent markdown sections are materially reduced without regressing note usefulness

## Goal

Polish the current extraction output just enough to make the Phase 4 narrative and technical notes more review-safe without reopening ingest, chunking, routing, or broader orchestration work. This slice should turn the current "useful but uneven" output into a smaller set of concept-led notes with cleaner titles, cleaner related links, and stable markdown structure.

## KISS Approach

1. Freeze the Phase 4 before-state with the new narrative rerun evidence and the bounded technical native Ollama smoke evidence already captured in [phase-4-extraction-verification-recovery.md](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/docs/0421/02/phase-4-extraction-verification-recovery.md).
2. Tighten post-extraction normalization only:
   title cleanup,
   duplicate suppression,
   related-link hygiene,
   and markdown section normalization.
3. Fix the smallest operator-facing reviewability issues discovered during verification:
   malformed progress labels and ambiguous Devbox output-dir reuse for the new bounded qwen3 smoke path.
4. Add only the focused tests needed to lock this polish behavior in place.
5. Rerun the same narrative and bounded technical fixtures and record one short before/after note that decides whether Phase 4.5 is sufficient to close the extraction-quality track.

## Scope

- In scope:
  extraction output normalization,
  duplicate-note reduction,
  related-link cleanup,
  markdown section consistency,
  and the smallest Devbox/workflow fixes needed to keep verification artifacts reviewable
- Out of scope:
  PDF loader changes,
  chunking changes,
  model-provider changes,
  prompt strategy rewrites,
  routing,
  LangGraph,
  resume/checkpoint work,
  and broad output schema redesign
- Stay unchanged:
  fixture set,
  offline-first local Ollama path,
  current chunking behavior,
  and the current manifest/artifact contract unless a tiny bug fix is required for reviewability
- Constraint:
  keep this slice post-extraction and reviewability-focused only; do not reopen architecture or add new optional pipeline branches

## Expected outcome

- Narrative and bounded technical notes keep their current usefulness while becoming more review-safe.
- Duplicate or malformed titles drop materially.
- Related links and markdown sections become more consistent and less placeholder-like.
- Verification runs are easier to compare because their output paths and progress labels are cleaner.

## Execution inputs

- Recovery source docs:
  [phase-4-extraction-verification-recovery.md](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/docs/0421/02/phase-4-extraction-verification-recovery.md)
  [phase-1-first-real-value-ollama-run.md](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/docs/0421/02/phase-1-first-real-value-ollama-run.md)
  [secondbrain-recovery-execution-tasks.md](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/docs/0421/02/secondbrain-recovery-execution-tasks.md)
- Verification fixtures:
  `tests/fixtures/test-anyone-ch1/HOW-TO-TALK-TO-Anyone-ch1.pdf`
  `tests/fixtures/test-head-first-sa-ch2-short/Head-First-Software-Architecture-ch2-short.txt`
- Required local runtime:
  native `Ollama.app` on macOS with the local models already available

## Phase plan

### Phase 4.5: Extraction polish and reviewability cleanup

- Target:
  reduce the remaining low-signal extraction defects that are visible after Phase 4
- Phase gate:
  Phase 4 runtime verification is green on the approved narrative PDF and the bounded technical native smoke path is green
- Phase output:
  cleaner extraction normalization behavior,
  one small workflow polish for reviewability,
  and one durable before/after comparison note
- Exit gate:
  duplicate or malformed concept titles are materially reduced,
  markdown section structure is consistent across generated notes,
  related links are no longer obviously placeholder-like or malformed in the reviewed sample,
  the bounded qwen3 technical smoke path writes to its own distinct output location,
  and the narrative plus bounded technical fixtures remain useful by the rubric
- Evidence loop:
  1. rerun the narrative PDF real-model path,
  2. rerun the bounded short technical qwen3 path,
  3. inspect note titles, related links, and markdown structure,
  4. publish one short before/after note with concrete examples
- Lean verification:
  one focused extraction regression suite,
  one narrative real-model rerun,
  one bounded technical qwen3 rerun,
  one manual note-quality review
