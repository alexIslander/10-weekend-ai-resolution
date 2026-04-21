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
```

Artifacts are written under `vault_output/<run-id>/` with:

- `atomics/` populated atomic-note markdown files
- `srqs/` populated SRQ markdown files when the SRQ slice is enabled
- `manifest.json` source and chunk metadata

The Phase 3 extractor prompt is owned at `src/second_brain_ingester/notes/prompts/extractor.md`.
The default `app`, `app-linker`, and `app-srq` scripts all use `tests/fixtures/test-anyone-ch1/HOW-TO-TALK-TO-Anyone-ch1.txt` so content checks are easier to review.
Use `devbox run app-effective-engineer-chapter` when you want a second realistic chapter fixture for later comparison runs.

## Devbox scripts

Use Devbox as the main project entrypoint:

```bash
devbox run sync
devbox run lint
devbox run typecheck
devbox run test
devbox run ingest-test
devbox run extractor-test
devbox run linker-test
devbox run srq-test
devbox run pipeline-test
devbox run help
devbox run app
devbox run app-linker
devbox run app-srq
devbox run app-anyone-chapter
devbox run app-effective-engineer-chapter
devbox run app-anyone-chapter-linker
devbox run app-anyone-chapter-srq
```
