# Phase 3 boundary-aware chunking

- Status: closed
- Date: 2026-04-23
- Branch: `feature/secondbrain-recovery-phase-3-boundary-chunking`

## Goal

Replace the fixed-width chunker with paragraph-first and sentence-aware chunking so the extractor sees fewer broken starts on the narrative fixture and less avoidable fragmentation on the technical fixture.

## Changes

- Replaced raw `textwrap.wrap` chunking with paragraph-first assembly, sentence-aware fallback, and deterministic hard-wrap fallback only for oversized sentences.
- Added one cross-page continuation heuristic so PDF page boundaries are no longer treated as automatic chunk boundaries when the previous page clearly ends mid-sentence.
- Kept chunk IDs deterministic and kept PDF chunk titles anchored to the first page that contributes to each chunk.
- Added a bounded Devbox Phase 3 regression command and documented it in `README.md`.

## Verification

- `devbox run --recompute=false phase-3-chunking-test`
  passed with 8 tests
- `devbox run --recompute=false app-anyone-chapter-pdf-source`
  completed and wrote `vault_output/devbox-app-anyone-chapter-pdf-source-run/how-to-talk-to-anyone-ch1-b83252c9/extracted-source.md`
- `devbox run --recompute=false app-head-first-sa-chapter-pdf-source`
  completed and wrote `vault_output/devbox-app-head-first-sa-chapter-pdf-run/head-first-software-architecture-ch2-d32643c5/extracted-source.md`

## Before and after

### Narrative PDF

- Before this phase, several chunks began in the middle of a sentence at PDF page boundaries, for example the earlier extracted-source artifact included a chunk starting with `completely against what the person was expecting`.
- After the Phase 3 chunker change, that same boundary is absorbed into the prior chunk and the next chunk now begins on a cleaner sentence boundary with `Through these experiments, we have learned...`.
- Result:
  the narrative PDF still has ingest-level spacing defects such as `neuralcoupling`, but the chunk starts are materially less fragmentary than the fixed-width baseline.

### Technical PDF

- Before this phase, fixed-width splitting regularly started chunks in the middle of ideas, for example a prior chunk began with `as you build it!` after the previous chunk ended at an arbitrary width boundary.
- After the Phase 3 change, that section now begins as a sentence-led chunk with `For example, architects should pay attention to the application's internal structure...`.
- The technical PDF still carries mixed-content and OCR-style ingest noise, but the chunk boundaries now follow sentence edges and page continuations more often than raw width limits.
- Chunk count increased from the previous fixed-width 76 chunks to 84 chunks because sentence-preserving splits intentionally avoid packing unrelated partial thoughts into the same chunk.

## Verdict

- Exit gate: green
- Narrative broken starts fell on the approved narrative PDF fixture.
- The technical PDF remains noisy, but chunk starts are less arbitrarily fragmented and more reviewable than the fixed-width baseline.
- Next safe slice: start `Phase 4: Extraction quality recovery` only.
