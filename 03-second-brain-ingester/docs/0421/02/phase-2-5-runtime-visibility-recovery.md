# Phase 2.5 runtime visibility recovery

## Status

- Date: 2026-04-22
- Phase: `Phase 2.5: Runtime visibility and loader decomposition`
- Branch: `feature/secondbrain-recovery-phase-2-5-runtime-visibility`
- Result: bounded operability proof green on the revised short technical `.txt` slice
- Blocker class: `none`

## What changed before the blocker

- Added bounded CLI status markers for `source_load`, `chunk_generation`, `extraction`, and `artifact_write`.
- Added durable per-stage timing fields to `manifest.json`.
- Split `src/second_brain_ingester/ingest/components/pdf_loader.py` into smaller parsing and text-decoding helpers without changing loader behavior.
- Added `devbox run phase-2-5-runtime-test` and documented it in `README.md`.

## Evidence

- `devbox run --recompute=false phase-2-5-runtime-test` passed.
- `devbox run --recompute=false phase-2-ingest-test` passed.
- `devbox run --recompute=false app-anyone-chapter-pdf` now prints stage markers before artifacts are written:
  `Loading source`, `Generating chunks`, `Extracting notes`, and `Writing artifacts`.
- `devbox run --recompute=false ollama-preflight` passed and listed the local model inventory:
  `llama3.3:70b`, `qwen3:8b`, `smollm2:1.7b`, `gemma3:latest`, `llama3.2:latest`, `mistral:latest`, and `codeqwen`.
- `devbox run --recompute=false app-head-first-sa-chapter-pdf-source-ollama-smoke` reached the real local Ollama path and emitted:
  `Loading source`,
  `Generating chunks`,
  `Extracting notes`,
  `Extracting chunk 1/76: Page 1 chunk 1`,
  `Completed chunk 1/76: Page 1 chunk 1`,
  and `Extracting chunk 2/76: Page 2 chunk 2`.
- The same technical smoke run did not complete within this execution pass, so the bounded operability proof is still red even though the endpoint blocker is gone.
- The short technical fixture comparison in [phase-2-5-short-head-first-pdf-vs-txt-comparison.md](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/docs/0421/02/phase-2-5-short-head-first-pdf-vs-txt-comparison.md) showed that the checked-in `.txt` is materially cleaner than the PDF extracted-source markdown artifact, so the `.txt` is the better bounded real-model smoke input while the PDF artifact remains useful as ingest-debug evidence.
- `devbox run --recompute=false 02-head-first-sa-chapter-short-txt-ollama-smoke` completed successfully on 2026-04-23 and wrote artifacts to:
  `vault_output/devbox-02-head-first-sa-chapter-short-txt-ollama-smoke-run/head-first-software-architecture-ch2-short-b00c0323`
- That run exercised the real local Ollama path on the revised bounded technical slice and emitted visible status markers for all six chunks before successful artifact write:
  `Loading source`,
  `Generating chunks`,
  `Extracting notes`,
  `Extracting chunk 1/6` through `Completed chunk 6/6`,
  `Completed extraction. (312.544s)`,
  `Writing artifacts`,
  and `Completed artifact_write. (0.005s)`

## Recovery decision

Close Phase 2.5 on the revised bounded slice definition. The long technical PDF real-model path remains too expensive for this machine to serve as the bounded verification loop, but the short technical `.txt` smoke run now provides a real local Ollama operability proof on the same runtime status and timing path, and the earlier comparison note explains why that `.txt` is the better bounded input for this phase.

## Next safe slice

1. Start `Phase 3: Boundary-aware chunking` only.
2. Carry forward the short technical comparison note so chunking work can distinguish ingest noise from chunk-boundary problems.
3. If a future phase needs full technical-PDF real-model validation, treat that as a separate quality or throughput slice rather than reopening Phase 2.5.
