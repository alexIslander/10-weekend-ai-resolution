# Phase 2.5 runtime visibility recovery

## Status

- Date: 2026-04-22
- Phase: `Phase 2.5: Runtime visibility and loader decomposition`
- Branch: `feature/secondbrain-recovery-phase-2-5-runtime-visibility`
- Result: blocked on the real Ollama verification gate
- Blocker class: `missing external dependency`

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
- `devbox run --recompute=false ollama-preflight` failed locally with:
  `unable to get image 'ollama/ollama' ... 500 Internal Server Error ... docker.sock`
- `curl -sS http://localhost:11434/api/tags` failed with:
  `Couldn't connect to server`

## Recovery decision

Do not close Phase 2.5 yet. The implementation slice is in place, but the real-model technical PDF smoke path cannot clear the phase exit gate until local Ollama is reachable again.

## Next safe slice

1. Keep a working local Ollama endpoint on `http://localhost:11434`.
2. Run `devbox run --recompute=false app-head-first-sa-chapter-pdf-source-ollama-smoke` with `smollm2:1.7b` as the bounded operability proof.
3. Confirm the technical PDF run emits chunk-level status markers before output artifacts land and can complete end to end.
4. If that smaller-model smoke run is green, decide whether Phase 2.5 can close on operability proof or whether one `qwen3:8b` run is still required before moving to Phase 3.
