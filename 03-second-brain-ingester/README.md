# second-brain-ingester

Python workspace for ingesting source material into structured second-brain artifacts.

## Bootstrap

Run these commands from the repository root:

```bash
devbox shell
uv sync
pre-commit install
ruff check .
mypy src
pytest
python -m second_brain_ingester.cli --help
```

## Development notes

- Python dependencies are managed with `uv`.
- System tooling is provided through `devbox`.
- Generated outputs should stay under `vault_output/`.

## Deterministic local ingest

Run the local placeholder pipeline against a text or PDF source:

```bash
python -m second_brain_ingester.cli run --input tests/fixtures/sample.txt --dry-run
python -m second_brain_ingester.cli run --input tests/fixtures/sample.pdf --dry-run
```

Artifacts are written under `vault_output/<run-id>/` with:

- `atomics/` markdown note placeholders
- `manifest.json` source and chunk metadata
