# Phase 0 baseline and rubric

This note freezes the honest before-state for the recovery slice described in
[secondbrain-recovery-execution-plan.md](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/docs/0421/02/secondbrain-recovery-execution-plan.md),
with rationale traced back to
[docs/0419/user-feedback-analisys.md](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/docs/0419/user-feedback-analisys.md)
and
[docs/0421/secondbrain-project-recovery-plan.md](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/docs/0421/secondbrain-project-recovery-plan.md).

## Fixture trio

- Narrative PDF: `tests/fixtures/test-anyone-ch1/HOW-TO-TALK-TO-Anyone-ch1.pdf`
- Technical PDF: `tests/fixtures/test-head-first-sa-ch2/Head-First-Software-Architecture-ch2.pdf`
- Control text: `tests/fixtures/test-head-first-sa-ch2/Head-First-Software-Architecture-ch2.txt`

## Baseline commands

- `devbox run app-anyone-chapter-pdf`
- `devbox run app-head-first-sa-chapter-pdf`
- `devbox run app-head-first-sa-chapter`

## Run records

### Narrative PDF

- Mode: deterministic dry-run with `--enable extractor`
- Command result: failed before output write
- Evidence: `ValueError: Unable to extract text from PDF: tests/fixtures/test-anyone-ch1/HOW-TO-TALK-TO-Anyone-ch1.pdf`
- Parser warnings: none emitted because ingest aborted before a `LoadedSource` was created
- Broken starts: not reviewable because no notes were produced
- Weak titles: not reviewable because no notes were produced
- Weak summaries: not reviewable because no notes were produced
- Technical fragments: not applicable
- Overall usefulness verdict: unusable; the current PDF path cannot process the planned Phase 1 narrative fixture

### Technical PDF

- Mode: deterministic dry-run with `--enable extractor`
- Output: `vault_output/phase0-head-first-sa-ch2-pdf/head-first-software-architecture-ch2-d32643c5/`
- Manifest summary: 11 chunks, 11 notes, 1 warning, 0 recorded pipeline errors
- Parser warning: `PDF extraction currently supports text-based stream content; image-only PDFs are not yet handled.`
- Broken-start examples:
  - note title `Head First Software Architecture Ch2: 1zrx D2s8`
  - note title `Head First Software Architecture Ch2: Ack7 0a44 M0ku`
- Weak-title examples:
  - `Head First Software Architecture Ch2: Nf6hcm2 Cdpf Zep6a D0ke Seii`
  - `Head First Software Architecture Ch2: H1kb`
- Weak-summary example:
  - the summary in `head-first-software-architecture-ch2-1zrx-d2s8.md` is mojibake rather than readable prose
- Technical fragment examples:
  - source excerpts contain binary-looking text and disconnected symbols instead of meaningful chapter content
  - all emitted chunks are tied to page `167`, which is a strong signal that the current PDF parsing path is not preserving document structure truthfully
- Overall usefulness verdict: unusable; notes are not review-safe and mostly reflect parser corruption rather than source ideas

### Control text

- Mode: deterministic dry-run with `--enable extractor`
- Output: `vault_output/devbox-app-head-first-sa-chapter-run/head-first-software-architecture-ch2-822940fe/`
- Manifest summary: 63 chunks, 63 notes, 0 warnings, 0 recorded pipeline errors
- Broken-start examples:
  - some note titles still begin mid-thought because chunking is fixed-width, not boundary-aware
- Weak-title examples:
  - titles are still fragment-led, but remain readable, for example `Head First Software Architecture Ch2: Access Only Certain Functions Within Application`
- Weak-summary examples:
  - summaries often restate chunk starts instead of producing a strong concept abstraction
- Technical fragment verdict:
  - substantially better than the PDF path; the text export stays legible and preserves domain vocabulary
- Overall usefulness verdict: borderline but reviewable; the extractor and chunker are weak, but the output is still materially better than the PDF path

## Supplemental sanity check

- `tests/fixtures/test-anyone-ch1/HOW-TO-TALK-TO-Anyone-ch1.txt` also runs successfully and produces readable but fragment-heavy titles like `Between Things They Heard What Their`.
- This supports the same conclusion as the technical control text: current extraction quality is weak even on text, but the hard product break is the PDF ingest path.

## Frozen rubric

Use these fields for Phase 1 and later before/after comparisons.

| Field | What to record | Phase 0 baseline |
| --- | --- | --- |
| Broken starts | Count and examples of notes that begin mid-sentence or mid-thought | Present in text runs; narrative PDF could not be evaluated because ingest failed |
| Weak titles | Count and examples of titles that are fragment-led, generic, or unreadable | Present in text runs; extreme in technical PDF where titles become gibberish |
| Weak summaries | Count and examples of summaries that only mirror chunk starts or contain corrupted text | Present in text runs; severe in technical PDF due to mojibake |
| Technical fragments | Whether technical vocabulary, diagrams, or structured content survive as meaningful note units | Control text partially survives; technical PDF does not |
| Parser warnings | Exact warnings or hard failures emitted by ingest | narrative PDF hard-fails; technical PDF emits one stream-only warning |
| Overall usefulness verdict | `useful`, `borderline`, or `unusable` with one-sentence justification | narrative PDF `unusable`, technical PDF `unusable`, control text `borderline` |

## Recovery note

- Blocker class: `missing external dependency` is not the issue; this is a real product-quality blocker in current PDF ingest behavior
- Evidence: the narrative PDF fixture fails outright, and the technical PDF emits corrupted note content that the text control does not
- Next safe slice: do not start real Ollama wiring until the Phase 1 narrative fixture can complete through the current pipeline or the fixture choice is revised with explicit justification
