# Phase 4 extraction verification recovery

- Status: recovered and closed on 2026-04-24
- Date: 2026-04-23
- Branch: `feature/secondbrain-recovery-phase-4-extraction-quality`
- Blocker class: `missing bounded verification`, resolved

## What passed

- `devbox run extractor-test`
  passed
- `devbox run phase-4-extraction-test`
  passed with 9 tests
- `devbox run ollama-preflight`
  passed and listed the local model inventory, including `qwen3:8b`
- `devbox run app-anyone-chapter-pdf-ollama`
  still reaches the real local Ollama path cleanly:
  `Loading source`,
  `Completed source_load.`,
  `Generating chunks`,
  `Completed chunk_generation.`,
  `Extracting notes`,
  `Extracting chunk 1/17: Page 1 chunk 1`

## What blocked Phase 4 closeout

- The approved narrative Phase 4 verification command,
  `devbox run app-anyone-chapter-pdf-ollama`,
  reached the real Ollama path and stayed healthy, but it still did not complete in a bounded review loop on this machine.
- Observed status markers before stopping the refreshed verification:
  `Loading source`,
  `Completed source_load. (0.047s)`,
  `Generating chunks`,
  `Completed chunk_generation. (0.000s)`,
  `Extracting notes`,
  `Extracting chunk 1/17: Page 1 chunk 1`
- Evidence:
  after 150 seconds in the extraction stage, no chunk completion or artifact-write marker had appeared.
- Evidence:
  the phase is no longer blocked on prompt wiring, schema parsing, or deterministic tests.
  It is blocked on the cost of rerunning the approved narrative PDF quality check with `qwen3:8b` in a review-sized loop.

## Next safe slice

1. Add one bounded Phase 4 narrative verification path that keeps the approved narrative PDF and real local extractor path, instead of swapping the fixture or silently weakening the model gate.
2. Make that bounded verification path explicit in `devbox.json`, `README.md`, and the Phase 4 task text before resuming closeout attempts.
3. Resume Phase 4 only after that bounded narrative path exists and can finish inside a review-sized loop on this machine.

## 2026-04-24 native Ollama bounded smoke report

- Status: partial recovery evidence added
- Scope: bounded technical real-model verification on the short technical `.txt` fixture after switching from the Docker-backed path to native `Ollama.app`

### Summary

- The native Ollama path is now operational enough for bounded real-model verification runs on this machine.
- The short technical `.txt` smoke path completed successfully with both `smollm2:1.7b` and `qwen3`.
- This removes the earlier concern that native Ollama was not usable for bounded local verification.
- The remaining open product gate is still the approved narrative PDF rerun for Phase 4 closeout.

### Run evidence

- `devbox run 02-head-first-sa-chapter-short-txt-ollama-smoke`
  completed end to end with:
  `Completed extraction. (60.901s)`
- `devbox run 03-head-first-sa-chapter-short-txt-ollama-smoke-qwen3`
  completed end to end with:
  `Completed extraction. (171.531s)`

### What the output confirms

- source load completed successfully
- chunk generation completed successfully
- extraction completed for all 7 chunks
- artifact write completed successfully
- run artifacts were written to disk

### Interpretation

- Native Ollama is healthy enough for bounded short technical real-model verification.
- `qwen3` is materially slower than `smollm2:1.7b`, but it still finishes inside a bounded review loop on the short technical fixture.
- This is consistent with the native macOS path being usable again for real-model verification work.
- This does not yet close Phase 4 because the approved narrative PDF verification path still needs to be rerun and judged against the rubric.

### Operational issues observed

- One earlier progress line showed `Completed chunk 6/7: Ch6`, which suggested a truncated or malformed chunk title in progress output.
- On the refreshed 2026-04-24 rerun, the `03-head-first-sa-chapter-short-txt-ollama-smoke-qwen3:8b` script wrote artifacts to the distinct expected output directory:
  `vault_output/devbox-03-head-first-sa-chapter-short-txt-ollama-smoke-qwen3:8b-run/head-first-software-architecture-ch2-short-b00c0323`
- That means the earlier output-path confusion is no longer an active blocker for reviewable verification runs.

### Updated assessment

- Native Ollama verification is no longer the main blocker for bounded technical smoke runs.
- The next meaningful product check is the approved narrative PDF rerun:
  `devbox run app-anyone-chapter-pdf-ollama`
- If that rerun now completes in a review-sized loop, update the Phase 4 blocker language and complete the missing extraction-quality comparison evidence.

## 2026-04-24 approved narrative PDF rerun report

- Status: runtime blocker cleared; quality follow-up still justified
- Scope: approved narrative PDF real-model verification on native `Ollama.app`

### Runtime evidence

- Command:
  `devbox run app-anyone-chapter-pdf-ollama`
- Result:
  completed successfully end to end
- Timings:
  `source_load` `0.037s`
  `chunk_generation` `0.000s`
  `extraction` `301.343s`
  `artifact_write` `0.012s`
- Output:
  `vault_output/devbox-app-anyone-chapter-pdf-ollama-run/how-to-talk-to-anyone-ch1-b83252c9`

### Manifest summary

- 17 chunks
- 22 notes
- 0 recorded pipeline errors
- 1 parser warning:
  `PDF extraction currently supports text-based stream content; image-only PDFs are not yet handled.`

### Comparison to earlier Phase 1 evidence

- The earlier Phase 1 proof on the same narrative PDF recorded 17 chunks and 17 notes.
- The current rerun produced 22 notes from the same 17 chunks.
- This means the Phase 4 extraction behavior is now exercising the intended zero/one/many-notes-per-chunk behavior rather than forcing a single note shape.
- The earlier runtime blocker is now cleared:
  the approved narrative PDF path completes on this machine, even though it remains slower than the short technical bounded smoke runs.

### Content quality assessment

- Overall usefulness verdict:
  `useful`
- Why:
  titles are mostly concept-led,
  summaries are largely complete and reviewable,
  and the notes are no longer embarrassing or fragment-led by default.

### Concrete wins

- Titles are mostly reusable and concept-based, for example:
  `The Power of Effective Storytelling`
  `Neural Coupling in Communication`
  `Language Shapes Memory Sharing`
  `Mental Health Influences Communication`
- Multiple-note extraction is now active in meaningful places:
  chunk 7 produced two notes,
  chunk 10 produced two notes,
  chunk 12 produced two notes,
  and chunk 16 produced three notes.
- The output clearly beats the Phase 0 narrative baseline, where the PDF path failed before note generation.

### Remaining quality problems

- Near-duplicate concept notes still appear:
  `Neuralcoupling in Communication`
  and
  `Neural Coupling in Communication`
- Title normalization is still too weak in some cases:
  `Neuralcoupling` should be corrected to `Neural Coupling`.
- Related links are still placeholder-quality or malformed in some notes:
  empty links,
  generic links such as `Active Listening Techniques`,
  and malformed local anchors.
- Markdown section normalization is still inconsistent across notes:
  some notes use `##` headings while others use `###`.
- Some notes remain chunk-local or advice-local rather than fully distilled concepts, for example:
  `Avoiding Over-Identification in Communication`
  and
  `Seek Professional Help for Persistent Mental Health Issues`
- Small output anomalies remain:
  the progress stream briefly emitted `Page 1 k 6`,
  which suggests a formatting or truncation bug in status output.

### Updated assessment

- Phase 4 is no longer blocked on the approved narrative runtime path.
- The remaining work is now a narrow extraction-polish slice, not an operability recovery slice.
- The next safe slice is a small Phase 4.5 cleanup focused on:
  title normalization,
  duplicate concept suppression,
  related-link hygiene,
  markdown section normalization,
  and Devbox/output-path polish for reviewable verification runs.

## 2026-04-24 closeout

- Status: Phase 4 closed
- Comparison note:
  [phase-4-extraction-quality-comparison.md](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/docs/0421/02/phase-4-extraction-quality-comparison.md)

### Final verification set

- `devbox run phase-4-extraction-test`
  passed with 9 tests
- `devbox run 03-head-first-sa-chapter-short-txt-ollama-smoke-qwen3:8b`
  completed end to end with:
  `Completed extraction. (173.561s)`
- `devbox run app-anyone-chapter-pdf-ollama`
  completed end to end with:
  `Completed extraction. (299.653s)`

### Closeout assessment

- The approved narrative PDF real-model path now completes inside a reviewable manual loop on this machine.
- The bounded technical real-model path now emits concept-led note titles instead of generic `Chunk N` placeholders.
- The remaining quality issues are real but small enough to defer to Phase 4.5 without keeping the Phase 4 exit gate red.
