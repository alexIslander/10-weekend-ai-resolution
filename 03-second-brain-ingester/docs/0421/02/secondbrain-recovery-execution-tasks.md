# Second Brain Recovery Execution Tasks

This checklist tracks only the active recovery slice and the immediately following slice from [secondbrain-recovery-execution-plan.md](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/docs/0421/02/secondbrain-recovery-execution-plan.md). Later phases stay out of the task file until the current evidence gates are green.

## Phase 0: Baseline capture and rubric freeze

- Target: `docs/0421/02/`
- Phase gate: no durable recovery baseline exists yet for one narrative PDF, one technical PDF, and one control `.txt` input.
- Phase output: one baseline note in `docs/0421/02/` with the frozen rubric and current failure examples.
- [x] Pick the smallest stable fixture trio and name them explicitly in the baseline note:
  one narrative PDF,
  one technical PDF,
  one control `.txt` file when available.
- [x] Run the current flow on the narrative PDF and record:
  provider or dry-run mode,
  parser warnings,
  broken-start examples,
  weak-title examples,
  weak-summary examples.
- [x] Run the current flow on the technical PDF and record:
  provider or dry-run mode,
  parser warnings,
  technical fragment examples,
  table or diagram degradation,
  whether note units are still meaningful.
- [x] Run the current flow on the control `.txt` input and record where extraction quality differs from the PDF path.
- [x] Freeze the Phase 0 rubric in the same note with the minimum judgment fields:
  broken starts,
  weak titles,
  weak summaries,
  technical fragments,
  parser warnings,
  overall usefulness verdict.
- [x] Link the baseline note back to:
  [docs/0419/user-feedback-analisys.md](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/docs/0419/user-feedback-analisys.md)
  and
  [docs/0421/secondbrain-project-recovery-plan.md](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/docs/0421/secondbrain-project-recovery-plan.md)
  so the recovery rationale stays traceable.
- [x] Lean verification:
  confirm there is one run record per fixture and one frozen rubric note under `docs/0421/02/`.
- [x] Exit gate: the repo has an honest before-state record that can be used for later before/after comparison.

## Phase 0.5: PDF ingest recovery

- Target: stabilize the narrative PDF fixture and prove extracted PDF text quality before any Ollama or orchestration work begins.
- Phase gate: Phase 0 baseline exists and the current narrative PDF fixture is still unstable in the local ingest path.
- Phase output: a loader-focused recovery note plus the smallest loader-only fix or explicit fixture replacement decision that makes Phase 1 safe to start, and one human-reviewable extracted-source markdown artifact for the narrative PDF.
- Phase 0.5 status: closed. The narrative PDF fixture now has a human-reviewed extracted-source markdown artifact and the local ingest path is stable enough for Phase 1. Recovery evidence is recorded in [phase-0-5-pdf-ingest-recovery.md](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/docs/0421/02/phase-0-5-pdf-ingest-recovery.md).
- Local checkpoint:
  work is prepared on branch `feature/secondbrain-recovery-pdf-ingest-recovery` as the Phase 0.5 closeout snapshot before Phase 1 starts.
- [x] Compare `tests/fixtures/test-anyone-ch1/HOW-TO-TALK-TO-Anyone-ch1.pdf` against:
  `tests/fixtures/test-head-first-sa-ch2/Head-First-Software-Architecture-ch2.pdf`
  and
  `tests/fixtures/test-effective-eng-ch1/Edmond-Lau-The-Effective-Engineer-Part-1-1.pdf`
  to isolate why the narrative fixture fails while reference fixtures load.
- [x] Inspect `src/second_brain_ingester/ingest/components/pdf_loader.py` and record the smallest plausible root cause for the narrative failure.
- [x] Keep scope loader-only:
  do not start Ollama wiring,
  do not change chunking,
  and do not start orchestration or routing work.
- [x] Make the smallest local-first change needed to stabilize the narrative fixture, or explicitly choose a replacement narrative PDF fixture with written justification if code change is not the right slice.
- [x] Rerun the narrative PDF through the existing local ingest path and record whether extracted text is readable enough for Phase 1 to be a model-quality test rather than a loader-failure test.
- [x] Rerun at least one reference PDF fixture and confirm the recovery slice did not regress an already-loading path.
- [x] Add the smallest test coverage that protects the chosen recovery path:
  one ingest-focused regression test or fixture-specific loader test.
- [x] Add one narrow optional CLI flag for this phase only:
  emit one big markdown file with extracted source text before atomic-note generation,
  keep it off by default,
  and keep it as a single run artifact rather than a second workflow.
- [x] Keep the artifact KISS:
  one file only,
  source metadata plus page or chunk separators only as needed,
  and the text should match what downstream extraction sees closely enough for review.
- [x] Run the narrative PDF with the extracted-source markdown artifact enabled and capture the artifact path in the Phase 0.5 recovery note.
- [x] Perform a human review on that extracted-source markdown artifact and record:
  obvious OCR or decode failures,
  page-order problems,
  paragraph break quality,
  and a simple go or no-go verdict for Phase 1.
- [ ] If the extracted-source markdown is not good enough, stop here, keep Phase 0.5 open, and record the next ingest-only recovery slice instead of starting Ollama work.
- [x] Exit gate: the narrative PDF path is stable enough that Phase 1 can begin without being blocked on `PdfSourceLoader`, and the extracted-source markdown artifact is human-approved as good enough for Phase 1.

## Phase 1: First real value on one narrative PDF

- Target: one real Ollama-backed narrative PDF run that writes markdown notes to disk.
- Phase gate: the Phase 0 baseline note exists, Phase 0.5 is closed, the chosen narrative PDF fixture is stable, and the extracted-source markdown artifact has been human-approved.
- Phase 1 status: ready to start, but not started in this task file. Phase 0.5 is closed with a human-approved extracted-source markdown artifact. Next safe slice: start one real Ollama-backed narrative PDF run and compare its note quality against the Phase 0 baseline.
- Phase output: a real local run result plus a short comparison note against the Phase 0 baseline.
- [ ] Remove the `--dry-run` requirement from the narrow CLI path needed for one real local run, without broadening orchestration scope.
- [ ] Add or confirm typed provider and model selection for the local path only:
  `--provider ollama`
  `--model`
  and the local config needed for `OLLAMA_BASE_URL` or equivalent.
- [ ] Wire the existing LLM boundary to Ollama for one real extractor path using:
  `qwen3:8b` as the default run model,
  with `llama3.3:70b` available only as a bounded stronger local fallback.
- [ ] Keep deterministic dry-run behavior for tests and debugging; do not delete it.
- [ ] Run the narrative PDF through the real local path and write markdown notes to disk.
- [ ] Add one durable comparison note under `docs/0421/02/` showing:
  the fixture used,
  the model used,
  whether notes are more useful than baseline,
  3-5 concrete examples of wins or remaining failures.
- [ ] Add the smallest test coverage that proves this slice is real and stable:
  one provider-boundary test for the Ollama path,
  one integration test or smoke test for the narrative PDF run path.
- [ ] Manual test:
  inspect a small sample of generated markdown notes and confirm at least several preserve complete ideas rather than leading fragments.
- [ ] Exit gate: one narrative PDF completes on a real local model path, writes markdown notes to disk, and shows a documented quality improvement or a clearly bounded remaining gap versus baseline.

## Hold line

- [ ] Do not start Ollama/provider wiring until Phase 0.5 is closed with evidence.
- [ ] Do not treat loader success alone as Phase 0.5 completion; the extracted-source markdown artifact must be human-approved first.
- [ ] Do not start chunking changes from this task file.
- [ ] Do not start PDF ingest hardening tasks until Phase 1 is closed with evidence.
- [ ] Do not start routing, cloud fallback, LangGraph, resume, or checkpoint work from this task file.
- [ ] If Phase 1 fails to beat baseline meaningfully, reopen the plan before expanding scope.

## Deferred reminder

- [ ] When Phase 2 starts, evaluate whether the custom PDF path should be replaced or wrapped with one dedicated PDF library so tables, images, and figure assets can be kept in hand as bounded ingest artifacts for later phases.
- [ ] In Phase 2, use `tests/fixtures/test-head-first-sa-ch2/Head-First-Software-Architecture-ch2.pdf` as the primary ingest-hardening check and fix the extracted-source failures already observed:
  encoding corruption such as `\222` and `\223`,
  stray symbol noise,
  sidebar or callout bleed,
  and obvious garbage-text chunks.
- [ ] In Phase 2, keep `tests/fixtures/test-effective-eng-ch1/Edmond-Lau-The-Effective-Engineer-Part-1-1.txt` as the clean control sample and `tests/fixtures/test-anyone-ch1/HOW-TO-TALK-TO-Anyone-ch1.pdf` as the acceptable narrative PDF reference with known spacing and paragraph-join noise.
- [ ] Keep that future slice KISS:
  one library choice,
  one bounded artifact shape for non-text PDF assets,
  and no attempt to fully understand or interpret tables and images in the same phase.
