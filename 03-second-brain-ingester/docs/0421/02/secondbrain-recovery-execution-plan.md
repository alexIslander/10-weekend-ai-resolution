# Second Brain Recovery Execution Plan

## Top product risks

1. PDF ingest quality can make the whole product useless even if the codebase looks complete.
   If the extracted page text is noisy, out of order, or incomplete, later chunking and extraction work cannot recover enough value.
2. Chunk boundaries can destroy meaning before the model sees the content.
   Fixed-width or page-noise-heavy chunks create broken note starts, weak titles, and low-signal markdown.
3. Local extraction quality may still fail on real inputs even when the pipeline runs end to end.
   A working CLI is not proof that the output is useful.
4. Orchestration can hide weak product quality behind more code.
   Adding graph flow, retries, and phase plumbing before proving one good offline path would repeat the current sequencing mistake.

## First real value

Phase 1 contains the first real value milestone:

- Real input: one narrative PDF fixture.
- Real output artifact: markdown notes written to disk from a real Ollama-backed run.
- Verification: run the same fixture twice, once with baseline output capture and once with the new real path, then compare against the Phase 0 rubric.
- Manual quality verdict: at least one reviewer can point to a small set of notes and say they are useful enough to keep rather than obviously fragmented or embarrassing.

Phase 0.5 is the gating recovery slice before that milestone:

- Real input: the current narrative PDF fixture and at least one reference PDF fixture.
- Real output artifact: a written go/no-go decision on the narrative PDF path, plus the smallest loader-only fix or justified fixture swap required to make the fixture stable.
- Verification: rerun the narrative PDF through the existing local ingest path and confirm readable extracted text exists before any Ollama or orchestration work begins.
- Manual quality verdict: the extracted narrative PDF text is legible enough that Phase 1 would be testing local-model extraction quality, not loader failure.

## Goal

Produce a real offline-first `PDF -> chunk -> extract -> markdown` path that yields useful notes from local Ollama models before any broader orchestration work continues. This plan translates the recovery direction in [docs/0421/secondbrain-project-recovery-plan.md](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/docs/0421/secondbrain-project-recovery-plan.md), the critique in [docs/0419/user-feedback-analisys.md](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/docs/0419/user-feedback-analisys.md), and the older architecture-first track in [docs/0419/secondbrain-v2-plan.md](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/docs/0419/secondbrain-v2-plan.md) into smaller, reviewable execution slices.

## KISS approach

1. Freeze a truthful baseline on a very small fixture set so later quality claims are evidence-based.
2. Recover the narrative PDF fixture so Phase 1 starts from a stable local ingest path rather than a known loader failure.
3. Prove one real offline-first Ollama path on one narrative PDF and write markdown notes to disk without `--dry-run`.
4. Harden PDF ingest on the same small fixture set before changing broader flow control.
5. Replace fixed-width chunking with boundary-aware chunking and rerun the same fixtures.
6. Improve extraction quality only after ingest and chunk boundaries are measurable.
7. Add one bounded routing decision only if it reduces wasted local inference and improves output quality.
8. Keep cloud fallback, LangGraph, checkpointing, and broader orchestration off the critical path until the offline path is already useful.

## Scope

- In scope: offline-first execution using local Ollama models, PDF ingest quality, chunk quality, extraction quality, fixture-based evaluation, and markdown output usefulness.
- In scope: narrow CLI and config changes required to run one real local path without `--dry-run`.
- In scope: durable evaluation notes and evidence captured under `docs/0421/`.
- Out of scope: broad LangGraph work, resume/checkpoint wiring, multi-agent expansion, optional cloud providers on the default path, and large architecture refactors.
- Stay unchanged: existing broad recovery docs under `docs/0421/` remain as context; this plan is the execution-ready slice plan.
- Constraint: each phase must close on a durable artifact plus a small evidence loop, not on code existence alone.
- Constraint: optional work is not allowed to block the offline-first path.

## Expected outcome

- The repository can run one real local PDF ingestion flow that writes useful markdown notes to disk.
- Quality claims are grounded in before/after evidence on a small stable fixture set.
- The next implementation slices become small enough to review without dragging orchestration back onto the critical path.

## Execution inputs

- Source plans and critiques:
  [docs/0419/secondbrain-v2-plan.md](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/docs/0419/secondbrain-v2-plan.md)
  [docs/0419/user-feedback-analisys.md](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/docs/0419/user-feedback-analisys.md)
  [docs/0421/secondbrain-project-recovery-plan.md](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/docs/0421/secondbrain-project-recovery-plan.md)
  [docs/0421/secondbrain-project-recovery-tasks.md](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/docs/0421/secondbrain-project-recovery-tasks.md)
- Local-first model assumption:
  `qwen3:8b` for the default cheap run path and `llama3.3:70b` as the bounded stronger local fallback.
- Minimum fixture set for recovery proof:
  one narrative PDF,
  one technical PDF,
  one control `.txt` export when available.

## Phase plan

### Phase 0: Baseline capture and rubric freeze

- Target: `docs/0421/` evaluation notes plus the smallest stable fixture set.
- Phase gate: the current repo state is still ahead of proof and no durable baseline exists for the recovery slice.
- Phase output: one named baseline note under `docs/0421/02/` that records current behavior for one narrative PDF, one technical PDF, and one control `.txt` input.
- Exit gate:
  baseline runs are captured,
  failure modes are named,
  and the rubric is frozen before code changes begin.
- Evidence loop:
  1. run the current flow on the three fixtures,
  2. record parser warnings, broken starts, weak titles, weak summaries, and technical fragment failures,
  3. preserve the exact provider or dry-run mode used.
- Lean verification:
  one existing CLI run per fixture,
  one written baseline note,
  one manual verdict on whether the output is useful or not.

### Phase 0.5: PDF ingest recovery

- Target: stabilize the narrative PDF fixture and expose extracted source text for human review before any Ollama or orchestration work begins.
- Phase gate: Phase 0 baseline note exists and shows that the current narrative PDF fixture is not stable enough for Phase 1.
- Phase output: a loader-focused recovery note plus the smallest loader-only code or fixture decision required to make the narrative PDF path stable, and one optional extracted-source markdown artifact that a human can review before trusting downstream note quality.
- Exit gate:
  the narrative PDF fixture loads successfully with readable extracted text through the existing local ingest path,
  one single-file extracted markdown artifact can be emitted from the ingest boundary for the narrative PDF,
  a human review says the extracted markdown is good enough to judge PDF extraction quality directly,
  or a replacement narrative PDF fixture is chosen with explicit written justification,
  and the roadmap plus task file point Phase 1 at the approved stable fixture.
- Constraint:
  do not start Ollama wiring, chunking changes, routing, or orchestration work in this phase.
- Evidence loop:
  1. compare the failing narrative PDF against at least one reference PDF that currently loads,
  2. isolate why `PdfSourceLoader` fails or degrades on the narrative fixture,
  3. make the smallest local-first fix or fixture decision that stabilizes the path,
  4. emit one extracted-source markdown artifact from the ingest boundary for the narrative PDF,
  5. rerun the narrative PDF through the existing ingest path and record whether the extracted markdown is readable enough for human approval.
- Lean verification:
  one ingest-focused regression test,
  one bounded smoke run that writes the extracted-source markdown artifact for the narrative PDF,
  one narrative PDF smoke run through the current local path,
  one reference PDF smoke run to confirm no regression.

### Phase 1: First real value on one narrative PDF

- Target: a real Ollama-backed `PDF -> chunk -> extract -> markdown` path without `--dry-run`.
- Phase gate: Phase 0 baseline note exists, Phase 0.5 is green, and the chosen narrative PDF fixture is stable.
- Phase output: real markdown notes written from one narrative PDF through the local model path, plus a short comparison note against the baseline.
- Exit gate:
  the CLI can run without `--dry-run`,
  one narrative PDF completes with local Ollama,
  notes are written to disk,
  and the comparison note shows at least a small quality win over baseline.
- Evidence loop:
  1. run the narrative PDF through the real local path,
  2. compare output against the Phase 0 rubric,
  3. record which notes are clearly usable and which still fail.
- Lean verification:
  one focused CLI smoke path,
  one integration test for the real local provider boundary,
  one manual review of a small note sample.
- Manual test:
  start the real local run,
  inspect the generated markdown folder,
  confirm at least several notes preserve complete ideas rather than fragment starts.

### Phase 2: PDF ingest hardening on the same fixture set

- Target: improve parser quality before broader chunking or routing work.
- Phase gate: Phase 1 first real value is green on the narrative PDF and Phase 0.5 already removed hard loader failure from the critical path.
- Phase output: improved PDF ingest behavior plus a short ingest-focused before/after note on the narrative and technical PDFs.
- Exit gate:
  narrative and technical PDFs both complete with explicit parser behavior,
  parser warnings are durable,
  and the technical PDF no longer fails silently or degrades without visibility.
- Evidence loop:
  1. freeze the Phase 1 output,
  2. change ingest only,
  3. rerun the same PDFs,
  4. record parser-related wins and remaining gaps.
- Lean verification:
  one ingest-focused test for parser failure behavior,
  one ingest smoke run on the narrative PDF,
  one ingest smoke run on the technical PDF.
- Deferred note for this phase:
  the current repo still uses a custom `PdfSourceLoader` rather than a dedicated PDF library,
  so table structure, embedded images, and figure assets are not being captured as durable ingest artifacts yet.
  When Phase 2 begins, evaluate whether a single PDF library can preserve those assets in hand for later phases without expanding the immediate text-quality gate.
  Keep this KISS:
  prefer one library choice and one bounded artifact shape for non-text assets,
  not full table understanding or image interpretation in the same slice.

### Phase 3: Boundary-aware chunking

- Target: replace fixed-width chunking with paragraph-first and sentence-aware chunking.
- Phase gate: PDF ingest is stable enough that parser failures are visible and bounded.
- Phase output: new chunking behavior plus a short before/after chunk quality note on the same fixture set.
- Exit gate:
  broken-start counts fall on the narrative PDF,
  technical chunks no longer over-fragment mixed-content pages as often,
  and the chunker behavior is covered by focused tests.
- Evidence loop:
  baseline chunk examples,
  chunker change,
  same-fixture rerun,
  written before/after examples.
- Lean verification:
  one chunk-boundary unit test,
  one narrative fixture rerun,
  one technical fixture rerun.

### Phase 4: Extraction quality recovery

- Target: improve note usefulness after ingest and chunking are no longer the main blockers.
- Phase gate: Phase 3 shows measurable chunk-quality improvement on the same fixture set.
- Phase output: better extraction prompts or parsing plus a durable quality comparison note.
- Exit gate:
  titles are meaning-based,
  summaries are not fragmentary,
  one chunk may yield zero/one/many notes,
  and the narrative plus technical PDFs both show usable notes by the rubric.
- Evidence loop:
  freeze Phase 3 outputs,
  change extraction only,
  rerun the same fixtures,
  record before/after note samples.
- Lean verification:
  one extractor parsing test,
  one narrative PDF run,
  one technical PDF run.

### Phase 5: Optional local routing

- Target: add one bounded router only if it saves inference and improves quality.
- Phase gate: Phase 4 is green and the offline-first flow is already useful without routing.
- Phase output: one small routing decision layer plus metrics on skip, merge, retry, or low-confidence outcomes.
- Exit gate:
  routing reduces wasted strong-model use or low-value extraction work,
  and the metrics are visible in a durable note or report.
- Constraint:
  do not add LangGraph or broad orchestration in this phase.

### Deferred work outside the critical path

- Optional cloud fallback is not required for first real value.
- LangGraph, resume, checkpointing, and broad orchestration are deferred until the offline path is already useful on the fixture set.
- Larger multi-agent expansion is deferred until routing proves it adds value rather than complexity.
- Rich PDF asset capture is deferred until the ingest path is already trusted for text:
  tables may currently flatten into text,
  and images or diagrams are not extracted as durable assets.
  Revisit a single-library upgrade later so tables, images, and figure references can be preserved for downstream use even before they are fully processed.
