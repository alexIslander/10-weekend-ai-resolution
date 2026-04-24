# Phase 4.5 extraction polish comparison

- Status: closed on 2026-04-24
- Branch: `feature/secondbrain-phase-4-5-extraction-polish`
- Scope: post-extraction normalization, duplicate suppression, related-link cleanup, markdown structure cleanup, and bounded qwen3 workflow reviewability

## Verification

- `devbox run phase-4-extraction-test`
  passed with 20 tests.
- `devbox run app-anyone-chapter-pdf-ollama`
  completed end to end.
  Extraction time: `710.655s`.
  Output:
  `vault_output/devbox-app-anyone-chapter-pdf-ollama-run/how-to-talk-to-anyone-ch1-b83252c9`
- `devbox run 03-head-first-sa-chapter-short-txt-ollama-smoke-qwen3`
  completed end to end.
  Extraction time: `166.116s`.
  Output:
  `vault_output/devbox-03-head-first-sa-chapter-short-txt-ollama-smoke-qwen3-run/head-first-software-architecture-ch2-short-b00c0323`

## Before and after

- Duplicate-title example:
  Phase 4 showed both `Neuralcoupling in Communication` and `Neural Coupling in Communication`.
  Phase 4.5 writes only `Neural Coupling in Communication` in the narrative manifest.
- Related-link cleanup example:
  the reviewed narrative and technical outputs no longer contain empty wiki links, `[[ ]]`, or the observed generic `Active Listening Techniques` placeholder.
  The reviewed `Neural Coupling in Communication` note now renders concrete related links such as `The Brain During Communication` and `MRI Studies on Neural Activity`.
- Markdown-structure cleanup example:
  generated atomic notes in the reviewed outputs use the canonical `## Summary`, `## Key details`, `## Related links`, and `## Source excerpt` sections.
  A scan for `### Summary`, `### Key details`, and `### Related links` returned no matches in the reviewed run outputs.
- Artifact cleanup example:
  rerunning a deterministic run id now replaces the prior run directory before writing artifacts.
  The narrative manifest reports 21 notes and the `atomics/` directory contains 21 markdown files, so stale notes no longer contaminate manual review.
- Workflow cleanup example:
  the bounded qwen3 technical smoke path now has a colon-free Devbox command and output directory:
  `devbox run 03-head-first-sa-chapter-short-txt-ollama-smoke-qwen3`.

## Quality verdict

The Phase 4.5 output remains useful on both fixtures.
The narrative output keeps concept-led notes around storytelling, neural coupling, memory, language, and mental-health communication.
The bounded technical output keeps architecture-focused notes around architectural characteristics, privacy approval, trade-off analysis, financial-domain characteristics, and quality attributes.

The cleanup is sufficient to close the extraction-quality track for this slice.
Remaining limitations, such as occasional model wording inside note bodies, should not reopen Phase 4.5 unless they become title, duplicate, link, or markdown-structure defects again.
