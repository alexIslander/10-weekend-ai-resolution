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
- Phase 1 status: closed on 2026-04-22 through the Docker-backed local Ollama path. The native Ollama binary on this machine still fails preflight, but the local model inventory was verified through `docker compose` and the narrative PDF completed with `qwen3:8b`. Recovery evidence for the native runtime remains recorded in [phase-1-ollama-preflight-recovery.md](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/docs/0421/02/phase-1-ollama-preflight-recovery.md), and the successful Phase 1 proof is recorded in [phase-1-first-real-value-ollama-run.md](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/docs/0421/02/phase-1-first-real-value-ollama-run.md).
- Additional evidence:
  `devbox run ollama-preflight` listed both `qwen3:8b` and `llama3.3:70b` from the existing local model store.
  The real run artifact is at `vault_output/devbox-app-anyone-chapter-pdf-ollama-run/how-to-talk-to-anyone-ch1-b83252c9/`.
  The manifest records 17 chunks, 17 atomic notes, 1 parser warning, and 0 pipeline errors.
- Local checkpoint:
  work is isolated on branch `feature/secondbrain-recovery-phase-1-ollama-path`.
- Next safe slice:
  start Phase 2 PDF ingest hardening only.
- Phase output: a real local run result plus a short comparison note against the Phase 0 baseline.
- [x] Remove the `--dry-run` requirement from the narrow CLI path needed for one real local run, without broadening orchestration scope.
- [x] Add or confirm typed provider and model selection for the local path only:
  `--provider ollama`
  `--model`
  and the local config needed for `OLLAMA_BASE_URL` or equivalent.
- [x] Wire the existing LLM boundary to Ollama for one real extractor path using:
  `qwen3:8b` as the default run model,
  with `llama3.3:70b` available only as a bounded stronger local fallback.
- [x] Keep deterministic dry-run behavior for tests and debugging; do not delete it.
- [x] Run the narrative PDF through the real local path and write markdown notes to disk.
- [x] Add one durable comparison note under `docs/0421/02/` showing:
  the fixture used,
  the model used,
  whether notes are more useful than baseline,
  3-5 concrete examples of wins or remaining failures.
- [x] Add the smallest test coverage that proves this slice is real and stable:
  one provider-boundary test for the Ollama path,
  one integration test or smoke test for the narrative PDF run path.
- [x] Manual test:
  inspect a small sample of generated markdown notes and confirm at least several preserve complete ideas rather than leading fragments.
- [x] Exit gate: one narrative PDF completes on a real local model path, writes markdown notes to disk, and shows a documented quality improvement or a clearly bounded remaining gap versus baseline.

## Phase 2: PDF ingest hardening on the same fixture set

- Target: improve parser quality on the approved narrative and technical fixtures before any chunking work begins.
- Phase gate: Phase 1 is closed, the narrative PDF path is stable, and the technical PDF still shows measurable ingest noise that must be made explicit.
- Phase 2 status: closed on 2026-04-22. Recovery evidence is recorded in [phase-2-pdf-ingest-hardening.md](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/docs/0421/02/phase-2-pdf-ingest-hardening.md).
- Local checkpoint:
  work is isolated on branch `feature/secondbrain-recovery-phase-2-ingest-hardening`.
- Additional evidence:
  `vault_output/devbox-app-head-first-sa-chapter-pdf-run/head-first-software-architecture-ch2-d32643c5/extracted-source.md`
  now shows 76 chunks with explicit warning lines, while the raw `\222`, `\223`, `\224`, `\205`, and `\227` escape artifacts are no longer present in loader output.
- Runtime confidence note:
  the real technical PDF Ollama path is not validated by Phase 2 closeout.
  `devbox run app-head-first-sa-chapter-pdf-source-ollama` can remain active for 30 minutes or longer without visible progress or final artifacts, so operational acceptability on the real-model technical fixture is still unknown.
- Next safe slice:
  start Phase 2.5 runtime visibility and loader decomposition only.
- Phase output: hardened literal-string PDF decoding, explicit per-page ingest warnings, and updated extracted-source evidence for the technical fixture.
- [x] Keep `tests/fixtures/test-head-first-sa-ch2/Head-First-Software-Architecture-ch2.pdf` as the primary ingest-hardening fixture and rerun it through the extracted-source path.
- [x] Fix PDF literal-string decoding so octal escape noise such as `\222` and `\223` is decoded into readable punctuation instead of surfacing verbatim.
- [x] Apply the page font cmap to literal PDF strings as well as hex strings so mixed-content pages decode more readably.
- [x] Strip control-glyph debris from extracted page text while keeping the page order stable.
- [x] Emit durable parser warnings for pages where control glyphs were stripped so technical-PDF degradation is visible instead of silent.
- [x] Surface the warning list inside the extracted-source markdown artifact so manual review can see parser behavior directly.
- [x] Add the smallest test coverage that protects this slice:
  one technical-fixture loader assertion,
  one extracted-source CLI assertion for the technical PDF,
  and one bounded Devbox regression command for Phase 2.
- [x] Verification:
  `devbox run --recompute=false phase-2-ingest-test`
  `devbox run --recompute=false app-head-first-sa-chapter-pdf-source`
  `devbox run --recompute=false app-anyone-chapter-pdf`
- [x] Exit gate: the narrative and technical PDFs complete with explicit parser behavior, parser warnings are durable, and the technical PDF no longer degrades through silent escaped-punctuation failure.

## Phase 2.5: Runtime visibility and loader decomposition

- Target: make long-running local PDF and Ollama runs observable enough to trust in-flight execution, and reduce loader maintenance risk before chunking work begins.
- Phase gate: Phase 2 is closed, but the technical PDF Ollama path still appears silent during long runs, the real-model technical fixture is still too slow to serve as a trustworthy verification loop, and `src/second_brain_ingester/ingest/components/pdf_loader.py` is still too large for safe incremental review.
- Phase output: bounded progress or status messages for long-running local runs, emitted stage timing data, and a smaller logical structure for the PDF loader with unchanged ingest behavior.
- Phase 2.5 status: closed on 2026-04-23. Implementation work landed, the local Ollama endpoint is reachable again, and the revised bounded operability proof is green on the short technical `.txt` slice. Recovery evidence is recorded in [phase-2-5-runtime-visibility-recovery.md](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/docs/0421/02/phase-2-5-runtime-visibility-recovery.md).
- Local checkpoint:
  work is isolated on branch `feature/secondbrain-recovery-phase-2-5-runtime-visibility`.
- Blocker:
  cleared by redefining the bounded technical operability proof to use the short technical `.txt` fixture documented in [phase-2-5-short-head-first-pdf-vs-txt-comparison.md](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/docs/0421/02/phase-2-5-short-head-first-pdf-vs-txt-comparison.md).
- Additional evidence:
  `devbox run --recompute=false app-anyone-chapter-pdf`
  now emits `Loading source`, `Generating chunks`, `Extracting notes`, and `Writing artifacts` before the run directory is written.
  `devbox run --recompute=false phase-2-5-runtime-test` passed.
  `devbox run --recompute=false ollama-preflight` listed `llama3.3:70b`, `qwen3:8b`, and `smollm2:1.7b`.
  `devbox run --recompute=false app-head-first-sa-chapter-pdf-source-ollama-smoke`
  emitted `Extracting chunk 1/76`, completed chunk 1, and started chunk 2 before the bounded verification window expired.
  The short technical comparison note in [phase-2-5-short-head-first-pdf-vs-txt-comparison.md](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/docs/0421/02/phase-2-5-short-head-first-pdf-vs-txt-comparison.md)
  shows that the checked-in `.txt` fixture is materially cleaner than the PDF extracted-source markdown content and is the better bounded real-model smoke input.
  `devbox run --recompute=false 02-head-first-sa-chapter-short-txt-ollama-smoke`
  completed successfully in 6 chunks, recorded `Completed extraction. (312.544s)`, and wrote artifacts to
  `vault_output/devbox-02-head-first-sa-chapter-short-txt-ollama-smoke-run/head-first-software-architecture-ch2-short-b00c0323`.
- Next safe slice:
  start Phase 3 boundary-aware chunking only,
  and use the saved short technical PDF-vs-txt comparison note to separate ingest noise from chunk-boundary problems.
- [x] Capture the current long-run operator pain in a short note:
  the recovery note records the earlier full technical-PDF slowdown and the revised bounded short technical `.txt` proof that closed the operability gate for this phase.
- [x] Record the current operational assumption explicitly:
  full technical-PDF real-model quality is still only partially validated,
  but Phase 2.5 runtime operability is now green on the revised bounded short technical `.txt` slice.
- [x] Add bounded status reporting around the major runtime milestones only:
  source load,
  chunk generation,
  extraction,
  and artifact write.
- [x] Emit durable timestamps for those same milestones so stage durations can be derived later without parsing ad hoc logs.
- [x] Keep the status reporting KISS:
  no streaming token logs,
  no progress percentages that cannot be justified,
  and no broad logging framework change in the same slice.
- [x] Keep the timing data KISS:
  capture major stage start and end times only,
  keep the field shape stable,
  and do not attempt token-level or sub-call micro-timing in this slice.
- [x] Break `src/second_brain_ingester/ingest/components/pdf_loader.py` into smaller logical units so parsing, text decoding, warning generation, and page extraction are no longer concentrated in one oversized file.
- [x] Keep behavior stable while decomposing the loader:
  no chunking changes,
  no prompt changes,
  and no routing changes.
- [x] Add only the smallest test coverage needed to protect this slice:
  one bounded status or logging assertion where practical,
  one bounded timing-field assertion where practical,
  and existing loader regressions kept green.
- [x] Verification:
  one bounded check that timing fields exist and are plausible,
  one loader-focused regression suite,
  one technical PDF Ollama smoke run,
  one narrative PDF non-regression run.
  Result:
  the timing and loader checks are green,
  the narrative non-regression run is green,
  `ollama-preflight` is green again,
  the full technical PDF Ollama path remains too expensive for a bounded loop on this machine,
  and the revised bounded short technical `.txt` Ollama smoke run is green.
- [x] Exit gate: a human can tell which major step a long-running run is in before output exists, stage timing data exists for the major runtime milestones, and the loader code is split into smaller reviewable pieces without changing ingest output.

## Phase 3: Boundary-aware chunking

- Target: replace fixed-width chunking with paragraph-first and sentence-aware chunking.
- Phase gate: Phase 2.5 is green and PDF ingest is stable enough that parser failures are visible and bounded.
- Phase output: new chunking behavior plus a short before/after chunk quality note on the same fixture set.
- Phase 3 status: closed on 2026-04-23 on branch `feature/secondbrain-recovery-phase-3-boundary-chunking`. Recovery evidence is recorded in [phase-3-boundary-aware-chunking.md](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/docs/0421/02/phase-3-boundary-aware-chunking.md).
- Local checkpoint:
  work is isolated on branch `feature/secondbrain-recovery-phase-3-boundary-chunking`.
- Additional evidence:
  the narrative extracted-source artifact no longer starts a later chunk with the broken continuation `completely against what the person was expecting`;
  that continuation is now absorbed into the preceding chunk and the next chunk begins with `Through these experiments, we have learned...`.
  The technical extracted-source artifact now starts the corresponding formerly broken section with `For example, architects should pay attention to the application's internal structure...` rather than with the fixed-width fragment `as you build it!`.
  Technical chunk count increased from 76 to 84 because sentence-preserving splits replaced arbitrary width cuts, but the new starts are more reviewable.
- Next safe slice:
  start Phase 4 extraction quality recovery only.
- [x] Review the short technical comparison note in [phase-2-5-short-head-first-pdf-vs-txt-comparison.md](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/docs/0421/02/phase-2-5-short-head-first-pdf-vs-txt-comparison.md) before tuning technical chunk boundaries so ingest noise is not mistaken for a chunking failure.
- [x] Replace fixed-width chunk splitting with paragraph-first chunk assembly and sentence-aware fallback while keeping chunk IDs deterministic and page association stable.
- [x] Keep this slice chunking-only:
  no loader changes,
  no prompt changes,
  and no routing or orchestration changes.
- [x] Add the smallest focused test coverage for the new chunking behavior:
  one paragraph-boundary assertion,
  one sentence-boundary assertion,
  and one bounded hard-wrap fallback assertion.
- [x] Add one bounded Devbox regression command for Phase 3 and document it in `README.md` in the same change.
- [x] Rerun the narrative fixture and capture whether broken chunk starts fall relative to the Phase 1 and Phase 2 baselines.
- [x] Rerun the technical fixture and capture whether mixed-content pages are still noisy but less over-fragmented than the fixed-width baseline.
- [x] Write one short before/after chunk-quality note under `docs/0421/02/` with concrete chunk examples from the narrative and technical fixtures.
- [x] Verification:
  `devbox run --recompute=false phase-3-chunking-test`
  `devbox run --recompute=false app-anyone-chapter-pdf-source`
  `devbox run --recompute=false app-head-first-sa-chapter-pdf-source`
  Result:
  the bounded Phase 3 suite passed,
  the narrative extracted-source rerun is green,
  and the technical extracted-source rerun is green with cleaner sentence-led chunk starts despite a higher total chunk count.
- [x] Exit gate: broken-start counts fall on the narrative PDF, technical chunks no longer over-fragment mixed-content pages as often, and chunker behavior is covered by focused tests.

## Phase 4: Extraction quality recovery

- Target: improve note usefulness after ingest and chunking are no longer the main blockers.
- Phase gate: Phase 3 is closed and the extractor can now evaluate cleaner chunk boundaries on the same fixture set.
- Phase output: better extraction prompting and output normalization plus a durable quality comparison note.
- Phase 4 status: blocked on 2026-04-23 on branch `feature/secondbrain-recovery-phase-4-extraction-quality`. Recovery evidence is recorded in [phase-4-extraction-verification-recovery.md](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/docs/0421/02/phase-4-extraction-verification-recovery.md).
- Local checkpoint:
  bounded extraction-quality code and tests are prepared on branch `feature/secondbrain-recovery-phase-4-extraction-quality`, but the approved narrative real-model verification loop is not yet bounded enough to close the phase honestly.
- [x] Keep this slice extraction-only:
  no loader changes,
  no chunking changes,
  and no routing or orchestration changes.
- [x] Allow the extractor boundary to return zero notes for connective or low-signal chunks instead of forcing one placeholder note per chunk.
- [x] Tighten extractor guidance so titles are concept-led, summaries are complete, and generic chunk-labeled notes are discouraged.
- [x] Add the smallest focused safeguards needed when model output is weak:
  normalize generic titles from summary text,
  normalize unstructured bodies into the expected markdown sections,
  and keep slug generation deterministic.
- [x] Add the smallest focused test coverage for the new extraction behavior:
  one empty-notes parsing assertion,
  one generic-title normalization assertion,
  one extraction-flow assertion that zero-note runs still write a valid artifact set.
- [x] Add one bounded Devbox regression command for Phase 4 and document it in `README.md` in the same change.
- [x] Verification:
  `devbox run phase-4-extraction-test`
  Result:
  the bounded Phase 4 regression suite passed with 9 tests.
- [ ] Rerun the approved narrative PDF through the real local Ollama path and capture whether weak titles and transitional notes fall relative to the Phase 1 output.
  Blocker:
  `devbox run app-anyone-chapter-pdf-ollama` still reaches the real local path cleanly, but on the refreshed 2026-04-23 verification it stayed in `Extracting chunk 1/17: Page 1 chunk 1` for more than 150 seconds without a chunk-complete or artifact-write marker, so the approved narrative `qwen3:8b` rerun remains too expensive for a bounded review loop on this machine.
- [ ] Rerun the bounded technical real-model fixture and capture whether titles stop collapsing to generic `Chunk N` labels.
- [ ] Write one short before/after extraction-quality note under `docs/0421/02/` with concrete narrative and technical note examples.
- [ ] Exit gate:
  titles are meaning-based,
  summaries are not fragmentary,
  one chunk may yield zero/one/many notes,
  and the narrative plus technical fixtures both show usable notes by the rubric.
  Current blocker evidence:
  `devbox run phase-4-extraction-test` is green,
  `devbox run ollama-preflight` is green,
  but the approved narrative real-model verification path is still not bounded enough to close the phase honestly.
  Next safe slice:
  add one bounded narrative verification path that keeps the approved narrative PDF and real local extractor gate,
  then document that path in `devbox.json` and `README.md` before retrying Phase 4 closeout.

## Hold line

- [ ] Do not start Ollama/provider wiring until Phase 0.5 is closed with evidence.
- [ ] Do not treat loader success alone as Phase 0.5 completion; the extracted-source markdown artifact must be human-approved first.
 - [ ] Do not start chunking changes from this task file.
- [x] Do not start PDF ingest hardening tasks until Phase 1 is closed with evidence.
- [ ] Do not start routing, cloud fallback, LangGraph, resume, or checkpoint work from this task file.
- [ ] If Phase 1 fails to beat baseline meaningfully, reopen the plan before expanding scope.
- [x] If a real product gate fails, stop, switch to discovery recovery mode, write the smallest recovery note, and update the task file with blocker, evidence, and next safe slice.

## Deferred reminder

- [x] In Phase 2, evaluate whether the custom PDF path should be replaced or wrapped with one dedicated PDF library so tables, images, and figure assets can be kept in hand as bounded ingest artifacts for later phases.
  Decision: keep the custom loader for this slice and defer a library swap until a later asset-preservation phase because the immediate gate was text readability and explicit parser visibility, not table or image capture.
- [x] In Phase 2, use `tests/fixtures/test-head-first-sa-ch2/Head-First-Software-Architecture-ch2.pdf` as the primary ingest-hardening check and fix the extracted-source failures already observed:
  escaped-punctuation corruption such as `\222` and `\223` is fixed,
  control-glyph debris is stripped,
  and remaining mixed-content bleed is now surfaced as explicit warnings in the extracted-source artifact.
- [x] In Phase 2, keep `tests/fixtures/test-effective-eng-ch1/Edmond-Lau-The-Effective-Engineer-Part-1-1.txt` as the clean control sample and `tests/fixtures/test-anyone-ch1/HOW-TO-TALK-TO-Anyone-ch1.pdf` as the acceptable narrative PDF reference with known spacing and paragraph-join noise.
- [x] Keep that future slice KISS:
  one library choice remains deferred,
  the artifact shape stays as one extracted-source markdown file,
  and this slice did not attempt table or image understanding.
- [x] Preserve the short technical PDF-vs-txt comparison for future chunking work:
  the `.txt` fixture is currently the cleaner bounded real-model smoke input,
  while the PDF extracted-source markdown artifact remains useful ingest evidence and may motivate a cleaner markdown extraction step before Phase 3 chunk optimization on noisy PDFs.
