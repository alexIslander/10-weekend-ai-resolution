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

## Deterministic local ingest

Run the local extraction dry run against a text or PDF source:

```bash
devbox run app
devbox run app-linker
```

Artifacts are written under `vault_output/<run-id>/` with:

- `atomics/` populated atomic-note markdown files
- `manifest.json` source and chunk metadata

The Phase 3 extractor prompt is owned at `src/second_brain_ingester/notes/prompts/extractor.md`.

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
devbox run pipeline-test
devbox run help
devbox run app
devbox run app-linker
```
