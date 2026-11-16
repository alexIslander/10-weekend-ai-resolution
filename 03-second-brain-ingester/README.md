# second-brain-ingester

Python workspace for ingesting source material into structured second-brain artifacts.

## Bootstrap

Run these commands from the repository root:

```bash
devbox shell
devbox run sync
uv run pre-commit install
devbox run lint
devbox run typecheck
devbox run test
devbox run pdf-recovery-test
devbox run phase-2-ingest-test
devbox run phase-2-5-runtime-test
devbox run phase-3-chunking-test
devbox run phase-4-extraction-test
devbox run phase-5-model-fit-test
devbox run ollama-native-preflight
devbox run ollama-native-ps
devbox run ollama-preflight
devbox run help
```

## Development notes

- Python dependencies are managed with `uv`.
- System tooling is provided through `devbox`.
- Generated outputs should stay under `vault_output/`.
- Use `tests/fixtures/test-anyone-ch1/HOW-TO-TALK-TO-Anyone-ch1.txt` as the default manual verification fixture for new implementation slices unless a phase requires a different corpus.
- When a new pipeline slice or workflow script is added, update `devbox.json` and document the script in this README in the same change.
- On macOS, prefer the native `Ollama.app` server for real-model runs because Docker Desktop does not provide GPU passthrough for Ollama on macOS.

## Deterministic local ingest

Run the local extraction dry run against a text or PDF source:

```bash
devbox run app
devbox run app-linker
devbox run app-srq
devbox run app-anti-pattern
devbox run app-adr
devbox run app-moc
devbox run app-adr-no-output
devbox run app-adr-no-output-2
devbox run app-anyone-chapter-pdf
devbox run app-anyone-chapter-pdf-source
devbox run app-head-first-sa-chapter-pdf
```

Artifacts are written under `vault_output/<run-id>/` with:

- `atomics/` populated atomic-note markdown files
- `adrs/` populated ADR markdown files when the ADR slice is enabled
- `srqs/` populated SRQ markdown files when the SRQ slice is enabled
- `anti-patterns/` populated anti-pattern markdown files when the anti-pattern slice is enabled
- `mocs/` populated MOC markdown files when the MOC slice is enabled
- `manifest.json` source and chunk metadata

The Phase 3 extractor prompt is owned at `src/second_brain_ingester/notes/prompts/extractor.md`.
The default `app`, `app-linker`, `app-srq`, `app-anti-pattern`, and `app-adr-no-output` scripts all use `tests/fixtures/test-anyone-ch1/HOW-TO-TALK-TO-Anyone-ch1.txt` so content checks are easier to review.
The `app-adr` and `app-moc` scripts use `tests/fixtures/test-head-first-sa-ch2/Head-First-Software-Architecture-ch2.txt` so Phase 4 review runs exercise the stronger architecture fixture by default.
Use `devbox run app-adr-no-output-2` when you want to run the ADR slice against `tests/fixtures/test-effective-eng-ch1/Edmond-Lau-The-Effective-Engineer-Part-1-1.txt`.
Use `devbox run app-effective-engineer-chapter` or `devbox run app-head-first-sa-chapter` when you want a second realistic chapter fixture for later comparison runs.
Use `devbox run app-anyone-chapter-pdf` and `devbox run app-head-first-sa-chapter-pdf` for repeatable Phase 0 and Phase 0.5 PDF recovery runs on the narrative and technical reference fixtures.
Use `devbox run app-anyone-chapter-pdf-source` when you need the single-file extracted-source markdown artifact for Phase 0.5 human review before Phase 1 starts.
Use `devbox run app-head-first-sa-chapter-pdf-source` when you need the technical PDF extracted-source markdown artifact during Phase 2 ingest hardening.
Use `devbox run ollama-native-up` to start the native `Ollama.app` instance from Devbox on macOS.
Use `devbox run ollama-native-preflight` as the preferred macOS GPU-backed check that the native `Ollama.app` server is running and the local model inventory is visible on `http://127.0.0.1:11434`.
Use `devbox run ollama-native-ps` to verify whether a loaded model is using GPU, CPU, or mixed placement on the native macOS server.
Use `devbox run ollama-preflight` only for the Docker-backed fallback path; it is not the preferred macOS path because Docker Desktop does not expose the Apple GPU to Ollama.
Use `devbox run app-anyone-chapter-pdf-ollama` for the bounded Phase 1 real-model smoke run on the approved narrative PDF fixture with `qwen3:8b`.
Use `devbox run app-head-first-sa-chapter-pdf-source-ollama` when you want the technical PDF run to use Ollama and still emit the extracted-source markdown artifact.
Use `devbox run app-head-first-sa-chapter-pdf-source-ollama-smoke` for the bounded Phase 2.5 operability proof on the technical PDF fixture with `smollm2:1.7b` when you want to prove the path is working before optimizing throughput.
Use `devbox run 01-head-first-sa-chapter-short-pdf-source` to write the short technical PDF extracted-source markdown artifact without relying on a real model, so you can compare the PDF-extracted markdown against the checked-in `.txt` fixture first.
Use `devbox run 02-head-first-sa-chapter-short-txt-ollama-smoke` after that comparison when you want the bounded real-model smoke run to operate only on the short technical `.txt` fixture with `smollm2:1.7b`.
Use `devbox run 03-head-first-sa-chapter-short-txt-ollama-smoke-qwen3` when you want the same bounded short technical `.txt` smoke path to run against `qwen3:8b` for a stronger local-model comparison. This command writes to `vault_output/devbox-03-head-first-sa-chapter-short-txt-ollama-smoke-qwen3-run`.
Use `devbox run pdf-recovery-test` for the bounded PDF recovery suite that protects the loader path, the local ingest PDF smoke path, and the extracted-source CLI artifact path.
Use `devbox run phase-2-ingest-test` for the bounded Phase 2 regression suite that covers narrative and technical PDF extraction plus extracted-source artifact warnings.
Use `devbox run phase-2-5-runtime-test` for the bounded Phase 2.5 regression suite that covers stage-status output, durable timing fields, and PDF loader non-regression.
Use `devbox run phase-3-chunking-test` for the bounded Phase 3 regression suite that covers paragraph-first chunking, sentence-aware fallback, and local ingest non-regression.
Use `devbox run phase-4-extraction-test` for the bounded Phase 4/4.5 regression suite that covers zero-note chunks, title/body normalization for weak model outputs, duplicate suppression, related-link cleanup, stale artifact cleanup, extraction-flow non-regression, and the bounded qwen3 workflow contract.
Use `devbox run phase-5-model-fit-test` for the bounded Phase 5 Devbox-script contract check that protects the local model-fit command inventory.
Use `devbox run notes-test` for the broader notes-layer regression suite when you want all note-component tests without running the full pipeline suite.
Use `devbox run anti-pattern-test` for the anti-pattern slice regression suite that covers note shaping, pipeline flow, markdown output, and CLI behavior.

## Native Ollama GPU verification

Ollama's official guidance is:

- Apple GPUs are supported through Metal.
- On macOS, use the native `Ollama.app` server rather than Docker Desktop if you want GPU acceleration.
- Verify model placement with `ollama ps`.

Example:

```bash
devbox run ollama-native-up
devbox run ollama-native-preflight
/Applications/Ollama.app/Contents/Resources/ollama run smollm2:1.7b "Say only: ok"
devbox run ollama-native-ps
```

Interpret the `PROCESSOR` column the same way Ollama documents it:

- `100% GPU`: model loaded entirely on GPU
- `100% CPU`: model loaded entirely in system memory
- `48%/52% CPU/GPU`: mixed placement

If `PROCESSOR` still shows `100% CPU` on macOS:

- confirm you are using the native `Ollama.app` path instead of the Homebrew CLI path
- confirm the native server is the listener on `127.0.0.1:11434`
- restart Ollama and re-run `ollama ps`
- if an update is available, apply it and re-test before deeper debugging

On this repository's current macOS setup, the native app-backed server detects Metal on `Apple M1 Pro`, but the official `ollama ps` verification still reports `100% CPU` for loaded local models. That means native Ollama is healthy, but GPU placement is not currently active for these runs.

## Devbox scripts

Use Devbox as the main project entrypoint:

```bash
devbox run sync
devbox run lint
devbox run typecheck
devbox run test
devbox run ollama-native-up
devbox run ollama-native-preflight
devbox run ollama-native-ps
devbox run ollama-up
devbox run ollama-down
devbox run ollama-preflight
devbox run phase-1-ollama-test
devbox run phase-2-ingest-test
devbox run phase-2-5-runtime-test
devbox run phase-3-chunking-test
devbox run phase-4-extraction-test
devbox run phase-5-model-fit-test
devbox run ingest-test
devbox run pdf-recovery-test
devbox run extractor-test
devbox run linker-test
devbox run srq-test
devbox run adr-test
devbox run moc-test
devbox run pipeline-test
devbox run help
devbox run app
devbox run app-linker
devbox run app-srq
devbox run app-anti-pattern
devbox run app-adr
devbox run app-moc
devbox run app-adr-no-output
devbox run app-adr-no-output-2
devbox run app-anyone-chapter
devbox run app-anyone-chapter-pdf
devbox run app-anyone-chapter-pdf-ollama
devbox run app-anyone-chapter-pdf-source
devbox run app-effective-engineer-chapter
devbox run app-head-first-sa-chapter
devbox run app-head-first-sa-chapter-pdf
devbox run app-head-first-sa-chapter-pdf-source-ollama
devbox run app-head-first-sa-chapter-pdf-source-ollama-smoke
devbox run app-head-first-sa-chapter-pdf-source
devbox run 01-head-first-sa-chapter-short-pdf-source
devbox run 02-head-first-sa-chapter-short-txt-ollama-smoke
devbox run 03-head-first-sa-chapter-short-txt-ollama-smoke-qwen3
devbox run app-anyone-chapter-linker
devbox run app-anyone-chapter-srq
devbox run app-anyone-long
devbox run app-anyone-short
devbox run app-effective-engineer-chapter-pdf-source
devbox run notes-test
devbox run anti-pattern-test
```
