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
devbox run ollama-preflight
devbox run help
```

## Development notes

- Python dependencies are managed with `uv`.
- System tooling is provided through `devbox`.
- Generated outputs should stay under `vault_output/`.
- Use `tests/fixtures/test-anyone-ch1/HOW-TO-TALK-TO-Anyone-ch1.txt` as the default manual verification fixture for new implementation slices unless a phase requires a different corpus.
- When a new pipeline slice or workflow script is added, update `devbox.json` and document the script in this README in the same change.

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
Use `devbox run ollama-preflight` to start the Docker-backed Ollama fallback and verify that the local model inventory is visible on `http://localhost:11434`.
Use `devbox run app-anyone-chapter-pdf-ollama` for the bounded Phase 1 real-model smoke run on the approved narrative PDF fixture with `qwen3:8b`.
Use `devbox run app-head-first-sa-chapter-pdf-source-ollama` when you want the technical PDF run to use Ollama and still emit the extracted-source markdown artifact.
Use `devbox run app-head-first-sa-chapter-pdf-source-ollama-smoke` for the bounded Phase 2.5 operability proof on the technical PDF fixture with `smollm2:1.7b` when you want to prove the path is working before optimizing throughput.
Use `devbox run 01-head-first-sa-chapter-short-pdf-source` to write the short technical PDF extracted-source markdown artifact without relying on a real model, so you can compare the PDF-extracted markdown against the checked-in `.txt` fixture first.
Use `devbox run 02-head-first-sa-chapter-short-txt-ollama-smoke` after that comparison when you want the bounded real-model smoke run to operate only on the short technical `.txt` fixture with `smollm2:1.7b`.
Use `devbox run pdf-recovery-test` for the bounded PDF recovery suite that protects the loader path, the local ingest PDF smoke path, and the extracted-source CLI artifact path.
Use `devbox run phase-2-ingest-test` for the bounded Phase 2 regression suite that covers narrative and technical PDF extraction plus extracted-source artifact warnings.
Use `devbox run phase-2-5-runtime-test` for the bounded Phase 2.5 regression suite that covers stage-status output, durable timing fields, and PDF loader non-regression.

## Devbox scripts

Use Devbox as the main project entrypoint:

```bash
devbox run sync
devbox run lint
devbox run typecheck
devbox run test
devbox run ollama-up
devbox run ollama-down
devbox run ollama-preflight
devbox run phase-1-ollama-test
devbox run phase-2-ingest-test
devbox run phase-2-5-runtime-test
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
devbox run app-anyone-chapter-linker
devbox run app-anyone-chapter-srq
```
