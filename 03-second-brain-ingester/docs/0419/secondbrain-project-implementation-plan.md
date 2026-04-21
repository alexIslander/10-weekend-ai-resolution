# Second Brain Project Implementation Plan

## Goal

Implement `03-second-brain-ingester/` directly at the repository root as a modern Python application that can ingest source material, turn it into structured second-brain artifacts, and grow into the v2 multi-agent pipeline without reworking the project skeleton later. This plan uses [PYTHON_PROJECT_SETUP_GUIDE.md](../project/PYTHON_PROJECT_SETUP_GUIDE.md), [MODULAR_DESIGN_GUIDELINES.md](../project/MODULAR_DESIGN_GUIDELINES.md), [Plan Material Ingest flow - 2026-04-18.md](./Plan%20Material%20Ingest%20flow%20-%202026-04-18.md), [secondbrain-v2-plan.md](./secondbrain-v2-plan.md), [secondbrain-anyone-fixture-evaluation-plan.md](./secondbrain-anyone-fixture-evaluation-plan.md), and [secondbrain-anyone-chapter-analisys.md](./secondbrain-anyone-chapter-analisys.md) as normative inputs.

## KISS Approach

1. Bootstrap the repository root as a reproducible Python workspace with `devbox`, `uv`, `pyproject.toml`, `ruff`, `mypy`, `pytest`, `pre-commit`, and a minimal CLI, so every later phase lands on stable tooling instead of ad hoc setup.
2. Lock the package layout and dependency-injection boundaries up front using protocol-first modules and orchestrators, so ingest, agent logic, and output writing can be developed and tested independently.
3. Implement the deterministic local ingest path first: source loading, PDF and text normalization, chunk contracts, note schema, run state, and markdown output writing without depending on live LLM calls.
4. Add the first LLM-backed extraction slice only after the local ingest contracts and writer outputs are stable, then expand the remaining v2 agents in small, reviewable phases.
5. Add LangGraph orchestration, CLI/config wiring, checkpointing, and quality reporting after the individual components already exist behind stable interfaces.

## Scope

- In scope: implementing the project directly in `03-second-brain-ingester/` with root-level setup files, `src/`, `tests/`, project docs, fixtures, and output conventions.
- In scope: concrete bootstrap artifacts required by [PYTHON_PROJECT_SETUP_GUIDE.md](../project/PYTHON_PROJECT_SETUP_GUIDE.md), including `devbox.json`, `pyproject.toml`, `uv.lock`, `.pre-commit-config.yaml`, typed settings, type checking, linting, formatting, testing, and reproducible environment commands.
- In scope: package boundaries required by [MODULAR_DESIGN_GUIDELINES.md](../project/MODULAR_DESIGN_GUIDELINES.md), including `typing.Protocol` contracts, dependency injection, orchestrators, isolated components, and tests that exercise orchestrators with mocks.
- In scope: the local material-ingest workflow and v2 business logic sequence defined by [Plan Material Ingest flow - 2026-04-18.md](./Plan%20Material%20Ingest%20flow%20-%202026-04-18.md) and [secondbrain-v2-plan.md](./secondbrain-v2-plan.md).
- In scope: improving chunk boundaries and atomic-note quality for book-like inputs using the fixture-driven findings and acceptance direction from [secondbrain-anyone-fixture-evaluation-plan.md](./secondbrain-anyone-fixture-evaluation-plan.md) and [secondbrain-anyone-chapter-analisys.md](./secondbrain-anyone-chapter-analisys.md).
- Out of scope: creating a numbered sub-project folder, deployment infrastructure, vector search from v3/v4 ideas, n8n orchestration, cloud infra, and optional future extensions not required by the v2 plan.
- Stay unchanged: `docs/0419/` source architecture notes remain reference inputs; they are not rewritten into a new concept doc outside this execution pair.
- Constraint: each phase must leave the repository in a runnable, testable state and be reviewable as a small PR instead of landing the full multi-agent system in one change set.

## Execution Inputs

- Python 3.12 is the planning baseline for `devbox` and `uv`.
- External credentials such as `ANTHROPIC_API_KEY` are not required until the extraction phase, but environment-variable names and settings plumbing must be established earlier.
- PDF fixtures, text fixtures, and generated vault output directories must stay local and deterministic so bootstrap and ingest phases can pass without live model access.
- The `HOW-TO-TALK-TO-Anyone` fixture family and their generated outputs are required execution inputs for the chunking and atomic-note-quality phase, and must remain stable enough to serve as regression data.

## Expected Outcome

- The repository root becomes a self-contained Python application workspace that another engineer can clone, enter with `devbox shell`, sync with `uv`, and validate with one standard check sequence.
- The ingest foundation is deterministic before LLM work starts, so writer contracts, note schema, and file outputs are stable and easy to review.
- The extraction foundation becomes semantically stronger for long-form book inputs, so generated notes preserve whole ideas instead of merely reflecting hard chunk windows.
- The broad v2 architecture is translated into a phase order that preserves its intended business logic while keeping each implementation slice small and mergeable.

## Required project shape

The implementation should converge on this repository-local structure because it satisfies the setup guide and the modular design guide without introducing extra folders:

```text
03-second-brain-ingester/
├── README.md
├── devbox.json
├── pyproject.toml
├── uv.lock
├── .pre-commit-config.yaml
├── .gitignore
├── .env.example
├── Dockerfile
├── src/
│   └── second_brain_ingester/
│       ├── __init__.py
│       ├── cli.py
│       ├── common/
│       │   ├── config.py
│       │   ├── logging.py
│       │   ├── models.py
│       │   └── types.py
│       ├── ingest/
│       │   ├── protocols.py
│       │   ├── orchestrator.py
│       │   └── components/
│       ├── notes/
│       │   ├── protocols.py
│       │   ├── orchestrator.py
│       │   └── components/
│       ├── output/
│       │   ├── protocols.py
│       │   ├── orchestrator.py
│       │   └── components/
│       └── pipeline/
│           ├── state.py
│           ├── graph.py
│           └── runner.py
├── tests/
│   ├── fixtures/
│   ├── common/
│   ├── ingest/
│   ├── notes/
│   ├── output/
│   └── pipeline/
└── docs/
    ├── project-overview.md
    └── architecture/
```

## v2 execution map

- Implementation Phase 0 maps to v2 Phase 0 and the setup/config parts of v2 Phase 12: scaffold, tooling, settings, CLI entrypoint, logging, and repo hygiene.
- Implementation Phase 1 maps to the structural expectations behind v2 Phases 1-13: package boundaries, protocols, orchestrators, shared models, and test seams that let later phases land without architectural churn.
- Implementation Phase 2 maps to v2 Phases 2, 3, and 5 plus the ingest specifics from [Plan Material Ingest flow - 2026-04-18.md](./Plan%20Material%20Ingest%20flow%20-%202026-04-18.md): source loading, PDF/text chunk production, note schema, pipeline state, and deterministic markdown writing.
- Implementation Phase 3 maps to v2 Phases 1 and 4: API client boundary, extraction prompts, structured extraction parsing, and the first end-to-end note generation slice.
- Implementation Phase 4 maps to v2 Phases 6, 7, 8, 9, and 10: linker, SRQ, anti-pattern, ADR, and MOC generation, each added behind the same protocol-driven node shape.
- Implementation Phase 5 maps to v2 Phases 11 and 12: LangGraph `StateGraph`, checkpointing, pipeline runner, CLI arguments, and config-file-driven execution.
- Implementation Phase 6 is a fixture-driven quality phase derived from [secondbrain-anyone-fixture-evaluation-plan.md](./secondbrain-anyone-fixture-evaluation-plan.md) and [secondbrain-anyone-chapter-analisys.md](./secondbrain-anyone-chapter-analisys.md): proper chunking, boundary-aware extraction, and atomic-note correctness for long-form source material.
- Implementation Phase 7 maps to v2 Phase 13: quality report generation, validation outputs, and final dry-run coverage over the full configured pipeline.

## Phase plan

### Phase 0: Bootstrap the root Python workspace

- Target: repository root `03-second-brain-ingester/`.
- Phase gate: the root currently contains only documentation and no runnable Python project files.
- Exit gate: `devbox shell`, `uv sync`, `ruff check .`, `mypy src`, `pytest`, and `python -m second_brain_ingester.cli --help` all run successfully from the root.
- Phase output: committed workspace files `README.md`, `devbox.json`, `pyproject.toml`, `uv.lock`, `.pre-commit-config.yaml`, `.gitignore`, `.env.example`, `Dockerfile`, initial package skeleton, and a smoke-tested CLI entrypoint.
- Test strategy: one environment bootstrap check, one lint/type/test check bundle, and one CLI smoke test. That is sufficient because the phase is pure tooling and package setup.
- Manual test: from a fresh clone, run `devbox shell`, `uv sync`, and `python -m second_brain_ingester.cli --help`; the command must print usage and exit `0`.

### Phase 1: Lock the modular package boundaries

- Target: `src/second_brain_ingester/` and mirrored `tests/` modules.
- Phase gate: the project tooling from Phase 0 is installed and green.
- Exit gate: protocol-first modules, orchestrators, typed shared models, and placeholder components exist for ingest, notes, output, and pipeline composition, with tests proving orchestrators can run against mocks.
- Phase output: stable package architecture aligned with [MODULAR_DESIGN_GUIDELINES.md](../project/MODULAR_DESIGN_GUIDELINES.md), plus a short architecture note under `docs/architecture/`.
- Test strategy: one focused unit test per orchestrator using mock protocol implementations, plus one import smoke test over the package entrypoints.
- Manual test: run the placeholder pipeline command against a fixture text file and confirm a deterministic no-LLM dry-run result is emitted to a temp output directory.

### Phase 2: Implement the deterministic local ingest path

- Target: `ingest/`, `common/`, `output/`, fixtures, and ingest-focused docs.
- Phase gate: module boundaries and placeholder pipeline wiring from Phase 1 are stable.
- Exit gate: the app can load local text and PDF sources, normalize them into chunk objects, carry source metadata into typed pipeline state, and write deterministic markdown artifacts without any live model dependency.
- Phase output: local material-ingest foundation matching [Plan Material Ingest flow - 2026-04-18.md](./Plan%20Material%20Ingest%20flow%20-%202026-04-18.md) with repeatable fixture coverage.
- Test strategy: one unit test for chunk normalization, one integration test for local ingest, and one snapshot-style assertion for generated markdown file shape.
- Manual test: run the CLI against a local sample text file and a small PDF fixture; each run must create the expected output folder, metadata file, and markdown note placeholders.

### Phase 3: Add the first extraction slice

- Target: LLM client boundary, extraction components, prompts, and extraction integration tests.
- Phase gate: the local ingest path and writer contracts are deterministic and documented.
- Exit gate: a typed API client boundary exists, extraction can turn chunks into structured note objects, and the pipeline can produce actual atomic-note content through one extraction-to-write path.
- Phase output: first business-logic slice from [secondbrain-v2-plan.md](./secondbrain-v2-plan.md) landed without yet introducing the full agent chain.
- Test strategy: one mocked extraction unit test, one integration dry-run with deterministic responses, and one invalid-response parsing test.
- Manual test: run the extraction command in dry-run mode and confirm the generated atomic note files contain populated frontmatter and body sections instead of placeholders.

### Phase 4: Land the remaining content-generation agents in small slices

- Target: note-enrichment modules for links, SRQs, anti-patterns, ADRs, and MOC generation.
- Phase gate: extraction-to-writer path is stable and the note schema is no longer changing.
- Exit gate: each remaining v2 agent exists behind a protocol/component pair, is covered by targeted tests, and is integrated one slice at a time without broad orchestration churn.
- Phase output: all content-generation responsibilities from v2 Phases 6-10 implemented against the same shared note and pipeline-state contracts.
- Test strategy: one focused unit or contract test per agent plus one rolling integration test that confirms previously generated artifacts remain compatible.
- Manual test: run the pipeline on a small fixture corpus and confirm links, SRQs, ADRs, anti-pattern notes, and the MOC are present in the generated output tree.

### Phase 5: Add LangGraph orchestration and config-driven execution

- Target: `pipeline/`, CLI/config plumbing, checkpointing, and run-state persistence.
- Phase gate: all component-level business logic needed for the configured graph already exists behind stable interfaces.
- Exit gate: the project can build a LangGraph `StateGraph`, checkpoint progress locally, resume a stopped run, and execute phase-enabled nodes from CLI/config settings.
- Phase output: orchestrated pipeline runner that maps directly back to the v2 node order while keeping component logic out of graph wiring code.
- Test strategy: one graph-construction test, one checkpoint/resume smoke test, and one config-driven CLI integration test.
- Manual test: start a dry run, stop it after an intermediate node, rerun with the same checkpoint path, and confirm execution resumes rather than restarting from scratch.

### Phase 6: Add proper chunking and quality atomic note extraction

- Target: `ingest/components/`, `notes/components/`, fixture-driven tests, and the docs that define the evaluation rubric for book-like inputs.
- Phase gate: deterministic ingest, first extraction, and at least the first enrichment slice already exist, but the current fixture outputs still show sentence-midpoint chunking and non-atomic note extraction as documented in [secondbrain-anyone-chapter-analisys.md](./secondbrain-anyone-chapter-analisys.md).
- Exit gate: the app can process the `HOW-TO-TALK-TO-Anyone` fixtures with boundary-aware chunking and materially better atomic-note extraction, producing notes that preserve complete ideas instead of leading-word fragments.
- Phase output: fixture-backed chunking and extraction improvements aligned with the acceptance direction in [secondbrain-anyone-fixture-evaluation-plan.md](./secondbrain-anyone-fixture-evaluation-plan.md), plus updated regression coverage and a durable before/after evaluation record under `docs/0419/`.
- Test strategy: one chunk-boundary unit test, one extraction-quality contract test, and one fixture-driven dry-run integration check against the chapter inputs. That is sufficient for this phase because the main risk is semantic breakage at chunk and note boundaries, not broad orchestration changes.
- Manual test: run the chapter fixture scripts and confirm notes no longer begin with broken fragments such as `brain.`, `brains.`, `well.`, or `the point.`, and that each reviewed note can be described as one coherent claim, mechanism, example, tactic, or warning.

### Phase 7: Add quality reporting and implementation closeout

- Target: validation and reporting modules, final docs updates, and end-to-end smoke coverage.
- Phase gate: the orchestrated pipeline runs through all intended nodes in dry-run mode.
- Exit gate: the app emits a quality report and validation summary, the root README and architecture docs describe the supported workflow, and the full dry-run check sequence is documented.
- Phase output: v2-complete implementation baseline for this repository, with bootstrap, business logic, orchestration, and validation all represented in concrete files.
- Test strategy: one validation unit test, one full dry-run integration check, and one documentation command audit to ensure the README commands match the implemented CLI.
- Manual test: execute the documented end-to-end command from the README and confirm the output directory contains notes, MOC, optional ADR and anti-pattern folders, checkpoint DB, and quality report artifacts.
