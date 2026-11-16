# Second Brain Project Implementation Tasks

This checklist executes [Second Brain Project Implementation Plan](./secondbrain-project-implementation-plan.md) and preserves the concrete setup, modularity, ingest, and v2 sequencing requirements from [PYTHON_PROJECT_SETUP_GUIDE.md](../project/PYTHON_PROJECT_SETUP_GUIDE.md), [MODULAR_DESIGN_GUIDELINES.md](../project/MODULAR_DESIGN_GUIDELINES.md), [Plan Material Ingest flow - 2026-04-18.md](./Plan%20Material%20Ingest%20flow%20-%202026-04-18.md), [secondbrain-v2-plan.md](./secondbrain-v2-plan.md), [secondbrain-anyone-fixture-evaluation-plan.md](./secondbrain-anyone-fixture-evaluation-plan.md), and [secondbrain-anyone-chapter-analisys.md](./secondbrain-anyone-chapter-analisys.md).

## Phase 0: Bootstrap the root Python workspace

- [x] Target repo path: implement directly in `03-second-brain-ingester/`; do not create a numbered project subfolder.
- [x] Phase gate: confirm the root contains docs only and no existing `pyproject.toml`, `src/`, `tests/`, or runnable Python package.
- [x] Create root files required by the setup guide:
  `README.md`, `devbox.json`, `pyproject.toml`, `uv.lock`, `.pre-commit-config.yaml`, `.gitignore`, `.env.example`, `Dockerfile`.
- [x] Create the initial package and test roots:
  `src/second_brain_ingester/__init__.py`, `src/second_brain_ingester/cli.py`, `tests/__init__.py`, `tests/fixtures/`.
- [x] Configure `devbox.json` for system-level dependencies and shell automation around Python 3.12, `uv`, and local virtual environment activation as required by [PYTHON_PROJECT_SETUP_GUIDE.md](../project/PYTHON_PROJECT_SETUP_GUIDE.md).
- [x] Configure `pyproject.toml` with:
  project metadata, package discovery from `src/`, runtime dependencies, dev dependencies, `ruff`, `mypy`, and `pytest` settings.
- [x] Use `pydantic` and `pydantic-settings` as the default validation and configuration stack in `pyproject.toml` and package planning; do not defer this decision to a later phase.
- [x] Add `.pre-commit-config.yaml` with the initial quality gates required by the setup guide and project-local workflow.
- [x] Add `.gitignore` rules for `.venv/`, `.env`, `.pytest_cache/`, `.mypy_cache/`, `.ruff_cache/`, `vault_output/`, `*.db`, and generated fixture outputs.
- [x] Add a minimal CLI entrypoint in `src/second_brain_ingester/cli.py` that prints help and exits `0`.
- [x] Write `README.md` with the exact bootstrap commands:
  `devbox shell`, `uv sync`, `pre-commit install`, `ruff check .`, `mypy src`, `pytest`, `python -m second_brain_ingester.cli --help`.
- [x] Add `.env.example` documenting planned variables such as `ANTHROPIC_API_KEY`, output path defaults, and dry-run flags with safe example values only.
- [x] Add a minimal `Dockerfile` so the project stays aligned with the setup guide's deployment-ready baseline, even if container runtime use remains out of scope for the first implementation slices.
- [x] Verification commands:
  `devbox shell`
  `uv sync`
  `ruff check .`
  `mypy src`
  `pytest`
  `python -m second_brain_ingester.cli --help`
- [x] Exit gate: all commands above pass from the repository root on a fresh environment.
- [x] Phase output: reproducible root-level Python workspace that another engineer can bootstrap without reading the source docs first.

## Phase 1: Lock the modular package boundaries

- [x] Phase gate: Phase 0 bootstrap commands pass from the root.
- [x] Create package domains aligned with [MODULAR_DESIGN_GUIDELINES.md](../project/MODULAR_DESIGN_GUIDELINES.md):
  `common/`, `ingest/`, `notes/`, `output/`, and `pipeline/` under `src/second_brain_ingester/`.
- [x] Add `protocols.py` modules using `typing.Protocol` for at least:
  source loading, chunk generation, extraction, note enrichment, markdown writing, checkpoint storage, and quality reporting.
- [x] Add `orchestrator.py` modules for `ingest/`, `notes/`, and `output/`; these orchestrators must accept dependencies via constructor injection instead of instantiating concrete components internally.
- [x] Add shared typed models in `common/models.py` and `common/types.py` for:
  source metadata, processed chunk, atomic note, ADR note, MOC summary, pipeline result, and error payload.
- [x] Add `common/config.py` using `pydantic-settings` for typed environment and config-file loading.
- [x] Add `common/logging.py` for project-local logging helpers that can be reused by CLI, orchestrators, and graph execution.
- [x] Add placeholder components under `ingest/components/`, `notes/components/`, and `output/components/` that satisfy the protocols without requiring live LLM access.
- [x] Add `tests/common/`, `tests/ingest/`, `tests/notes/`, `tests/output/`, and `tests/pipeline/` so tests mirror the source structure as required by the setup guide.
- [x] Add orchestrator tests that inject mocks or fakes implementing the protocols instead of calling real components.
- [x] Write `docs/architecture/modular-layout.md` documenting the chosen package structure, dependency-injection rules, and which modules own orchestration versus low-level work.
- [x] Verification commands:
  `ruff check .`
  `mypy src`
  `pytest tests/common tests/ingest tests/notes tests/output`
- [x] Manual test:
  `python -m second_brain_ingester.cli run --input tests/fixtures/sample.txt --dry-run`
  Confirm the placeholder pipeline path runs without live credentials and creates a deterministic temp output tree.
- [x] Exit gate: package boundaries are fixed, documented, typed, and testable with mocks.
- [x] Phase output: modular skeleton that future business-logic work can extend without restructuring the repo.

## Phase 2: Implement the deterministic local ingest path

- [x] Phase gate: protocol-first package skeleton and mock-driven tests are stable.
- [x] Create local source fixtures:
  `tests/fixtures/sample.txt` and one small PDF fixture suitable for deterministic ingest testing.
- [x] Implement text-source loading under `src/second_brain_ingester/ingest/components/` with typed source metadata capture.
- [x] Implement PDF loading and normalization under `ingest/components/` consistent with the ingest workflow in [Plan Material Ingest flow - 2026-04-18.md](./Plan%20Material%20Ingest%20flow%20-%202026-04-18.md).
- [x] Implement chunk normalization and chunk IDs so downstream note generation and output writing have deterministic inputs.
- [x] Add `pipeline/state.py` with the shared typed run state required to carry source metadata, chunks, generated notes, warnings, and errors across phases.
- [x] Implement deterministic markdown writing under `output/components/` for:
  atomic notes, metadata manifests, and per-run output folders.
- [x] Define output-path rules in config and docs so generated artifacts stay under a single root such as `vault_output/` and remain gitignored.
- [x] Add failure handling for unreadable paths, unsupported file types, empty chunk sets, and invalid output directories.
- [x] Add or update docs explaining how this deterministic ingest phase maps back to [Plan Material Ingest flow - 2026-04-18.md](./Plan%20Material%20Ingest%20flow%20-%202026-04-18.md).
- [x] Add tests:
  `tests/ingest/test_text_loader.py`
  `tests/ingest/test_pdf_loader.py`
  `tests/ingest/test_chunker.py`
  `tests/output/test_markdown_writer.py`
  `tests/pipeline/test_local_ingest_flow.py`
- [x] Verification commands:
  `pytest tests/ingest tests/output tests/pipeline/test_local_ingest_flow.py`
  `python -m second_brain_ingester.cli run --input tests/fixtures/sample.txt --dry-run --output-dir /tmp/second-brain-smoke`
- [x] Manual test:
  Run the CLI once with the text fixture and once with the PDF fixture.
  Confirm each run writes deterministic markdown output and a metadata artifact under the configured output root.
- [x] Exit gate: the app performs a fully local ingest-to-files flow without live model access.
- [x] Phase output: stable ingest foundation ready for the first v2 extraction slice.

## Phase 3: Add the first extraction slice

- [x] Phase gate: the local ingest path and markdown writer outputs are deterministic.
- [x] Implement the API client boundary from v2 Phase 1 under a dedicated module such as `notes/components/api_client.py` or `common/llm.py`, keeping callers dependent on protocols rather than a concrete provider.
- [x] Support typed request and response parsing for extraction, including deterministic dry-run responses for tests and local verification.
- [x] Add extraction prompt assets under a dedicated prompts location if the implementation needs external prompt files; keep prompt ownership explicit in docs.
- [x] Implement the extractor component from v2 Phase 4 so chunks can produce structured atomic-note objects matching the shared models.
- [x] Ensure the writer can persist populated note content, frontmatter, links, and source metadata from extracted notes without changing the Phase 2 output contract shape.
- [x] Add tests:
  `tests/notes/test_api_client.py`
  `tests/notes/test_extractor.py`
  `tests/pipeline/test_extraction_flow.py`
- [x] Verification commands:
  `pytest tests/notes/test_api_client.py tests/notes/test_extractor.py tests/pipeline/test_extraction_flow.py`
  `python -m second_brain_ingester.cli run --input tests/fixtures/sample.txt --dry-run --enable extractor`
- [x] Manual test:
  Run the extractor in dry-run mode and confirm the generated note files now contain populated content sections instead of placeholder text.
- [x] Exit gate: one v2-aligned extraction-to-write slice runs end to end through the implemented CLI.
- [x] Phase output: first real business-logic slice from the v2 architecture, delivered without the rest of the agent chain.

## Phase 4: Land the remaining content-generation agents in reviewable slices

- Current slice status: `feature/second-brain-ingester-phase-4-linker` implements the linker sub-slice first so Phase 4 stays reviewable and does not batch all five agents together.
- [ ] Phase gate: extraction output, note schema, and writer contracts are stable.
- [x] Implement v2 Phase 6 linker logic behind its own protocol and component pair.
- [ ] Implement v2 Phase 7 SRQ generation behind its own protocol and component pair.
- [ ] Implement v2 Phase 8 anti-pattern extraction behind its own protocol and component pair.
- [ ] Implement v2 Phase 9 ADR generation behind its own protocol and component pair.
- [ ] Implement v2 Phase 10 MOC generation behind its own protocol and component pair.
- [ ] Keep each agent slice in its own reviewable PR or checklist sub-slice; do not batch all five into one undifferentiated change.
- [ ] Add targeted tests for each new component and at least one compatibility check confirming previously generated note objects still pass through later phases unchanged.
- [ ] Verification commands per slice:
  `pytest tests/notes`
  `python -m second_brain_ingester.cli run --input tests/fixtures/sample.txt --dry-run --enable <agent-name>`
- [ ] Manual test:
  Run the growing pipeline on a small fixture corpus and confirm generated outputs now include links, SRQs, ADR notes, anti-pattern notes, and an MOC file in the expected folders.
- [ ] Exit gate: v2 Phases 6-10 are all implemented behind stable interfaces and validated independently.
- [ ] Phase output: complete content-generation layer ready for graph orchestration.

## Phase 5: Add LangGraph orchestration and config-driven execution

- [ ] Phase gate: all required content-generation components already exist as independently tested modules.
- [ ] Implement `pipeline/graph.py` to construct the LangGraph `StateGraph` in the v2 node order without embedding business logic in the graph file itself.
- [ ] Implement `pipeline/runner.py` for graph execution, checkpoint path handling, and resume behavior.
- [ ] Extend `common/config.py` and CLI parsing so users can enable or disable phases, pass checkpoint locations, choose output directories, and use dry-run mode from command-line or config file inputs.
- [ ] Add checkpoint persistence under a local file such as `vault_output/<run>/pipeline.db`, keeping generated databases gitignored.
- [ ] Add tests:
  `tests/pipeline/test_graph.py`
  `tests/pipeline/test_runner.py`
  `tests/pipeline/test_resume_flow.py`
  `tests/pipeline/test_cli_config.py`
- [ ] Verification commands:
  `pytest tests/pipeline/test_graph.py tests/pipeline/test_runner.py tests/pipeline/test_resume_flow.py tests/pipeline/test_cli_config.py`
  `python -m second_brain_ingester.cli run --input tests/fixtures/sample.txt --dry-run --checkpoint-path /tmp/second-brain.db`
- [ ] Manual test:
  Start a dry run, interrupt it after an intermediate phase, rerun with the same checkpoint path, and confirm the resumed run continues from saved progress.
- [ ] Exit gate: the configured graph executes and resumes through the implemented phases using local checkpoint state.
- [ ] Phase output: v2 Phase 11 and config-driven execution from Phase 12 are implemented in concrete code.

## Phase 6: Add proper chunking and quality atomic note extraction

- [ ] Phase gate: deterministic ingest, extraction, and the initial linker slice exist, but the current `HOW-TO-TALK-TO-Anyone` outputs still show broken note boundaries and non-atomic summaries as documented in [secondbrain-anyone-chapter-analisys.md](./secondbrain-anyone-chapter-analisys.md).
- [ ] Treat [secondbrain-anyone-fixture-evaluation-plan.md](./secondbrain-anyone-fixture-evaluation-plan.md) and [secondbrain-anyone-chapter-analisys.md](./secondbrain-anyone-chapter-analisys.md) as required source context for this phase; do not optimize chunking or extraction without preserving their rubric and findings.
- [ ] Freeze a baseline evaluation for:
  `tests/fixtures/test-anyone-ch1/`
  `tests/fixtures/test-anyone-until-ch1/`
  `tests/fixtures/test-anyone-until-ch3/`
  including note counts, broken-fragment counts, weak-title counts, and weak-link observations.
- [ ] Update chunking so it prefers paragraph and sentence boundaries before falling back to hard-width segmentation.
- [ ] Add chunking tests that explicitly guard against sentence-midpoint and idea-midpoint fragmentation on representative fixture text.
- [ ] Improve extraction so titles and summaries represent the meaning of the note rather than the first few words of the chunk.
- [ ] Allow extraction to preserve one coherent idea per note, even when that means producing more than one note from a chunk or carrying slightly more context inside one note.
- [ ] Add extraction tests that fail on degenerate outputs such as one-word summaries, meaningless leading-word titles, or notes that obviously begin mid-thought.
- [ ] Re-run the chapter fixture scripts and compare the before/after outputs against the rubric in [secondbrain-anyone-fixture-evaluation-plan.md](./secondbrain-anyone-fixture-evaluation-plan.md).
- [ ] Extend the evaluation to `test-anyone-until-ch1` and `test-anyone-until-ch3` so longer book-like inputs prove chunking and note quality do not degrade disproportionately.
- [ ] Record the post-change evaluation in a durable doc or checklist update under `docs/0419/`, including residual gaps and the next smallest follow-up.
- [ ] Verification commands:
  `devbox run app-anyone-chapter`
  `devbox run app-anyone-chapter-linker`
  `pytest tests/ingest tests/notes tests/pipeline`
- [ ] Manual test:
  Review a sample of generated notes and confirm each one preserves a complete claim, mechanism, example, tactic, or warning, and that notes no longer start with fragments such as `brain.`, `brains.`, `well.`, or `the point.`
- [ ] Exit gate: the chapter and multi-chapter fixtures show materially better chunk boundaries and atomic-note quality, and the improvement is documented against the evaluation rubric rather than judged informally.
- [ ] Phase output: regression-backed chunking and extraction behavior suitable for long-form book inputs.

## Phase 7: Add quality reporting and closeout verification

- [ ] Phase gate: the orchestrated pipeline can execute the intended phases in dry-run mode.
- [ ] Implement v2 Phase 13 validation and quality-report generation under `output/components/` or a dedicated validation module, keeping the API protocol-driven.
- [ ] Define the report artifacts and file names that must be emitted for each run, including summary counts, warnings, and validation failures.
- [ ] Update `README.md` and project docs so the documented bootstrap, run, and verification commands match the implemented CLI and file layout exactly.
- [ ] Add tests:
  `tests/output/test_quality_report.py`
  `tests/pipeline/test_end_to_end_dry_run.py`
- [ ] Verification commands:
  `ruff check .`
  `mypy src`
  `pytest`
  `python -m second_brain_ingester.cli run --input tests/fixtures/sample.txt --dry-run --output-dir /tmp/second-brain-final`
- [ ] Manual test:
  Execute the documented end-to-end command from `README.md`.
  Confirm the output tree contains generated notes, MOC output, optional ADR and anti-pattern folders when enabled, a checkpoint database, and the quality report artifact.
- [ ] Exit gate: the root project is documented, fully bootstrapped, and able to complete a dry-run end-to-end pipeline pass with validation artifacts.
- [ ] Phase output: execution-ready implementation baseline that covers bootstrap, modular foundations, business logic, orchestration, and reporting.
