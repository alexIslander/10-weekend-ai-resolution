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

## Phase 1: First real value on one narrative PDF

- Target: one real Ollama-backed narrative PDF run that writes markdown notes to disk.
- Phase gate: the Phase 0 baseline note exists and the chosen narrative PDF fixture is fixed.
- Phase 1 status: blocked. `tests/fixtures/test-anyone-ch1/HOW-TO-TALK-TO-Anyone-ch1.pdf` currently fails in the existing dry-run path with `ValueError: Unable to extract text from PDF`, recorded in [phase-0-baseline-and-rubric.md](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/docs/0421/02/phase-0-baseline-and-rubric.md). Next safe slice: recover the narrative PDF ingest path or explicitly replace the narrative fixture before starting real Ollama wiring.
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

- [ ] Do not start PDF ingest hardening tasks until Phase 1 is closed with evidence.
- [ ] Do not start routing, cloud fallback, LangGraph, resume, or checkpoint work from this task file.
- [ ] If Phase 1 fails to beat baseline meaningfully, reopen the plan before expanding scope.
