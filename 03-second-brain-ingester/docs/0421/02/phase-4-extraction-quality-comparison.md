# Phase 4 extraction quality comparison

## Decision

Go. Phase 4 is closed on 2026-04-24. The extractor now clears the Phase 4 gate on the approved narrative PDF and the bounded technical real-model fixture, with remaining issues small enough to treat as follow-on polish rather than a red product gate.

## Run context

- Narrative fixture:
  `tests/fixtures/test-anyone-ch1/HOW-TO-TALK-TO-Anyone-ch1.pdf`
- Narrative verification command:
  `devbox run app-anyone-chapter-pdf-ollama`
- Narrative output artifact:
  `vault_output/devbox-app-anyone-chapter-pdf-ollama-run/how-to-talk-to-anyone-ch1-b83252c9/`
- Narrative result:
  17 chunks,
  22 notes,
  1 parser warning,
  0 pipeline errors,
  extraction completed in `299.653s`
- Technical fixture:
  `tests/fixtures/test-head-first-sa-ch2-short/Head-First-Software-Architecture-ch2-short.txt`
- Technical verification command:
  `devbox run 03-head-first-sa-chapter-short-txt-ollama-smoke-qwen3:8b`
- Technical output artifact:
  `vault_output/devbox-03-head-first-sa-chapter-short-txt-ollama-smoke-qwen3:8b-run/head-first-software-architecture-ch2-short-b00c0323/`
- Technical result:
  7 chunks,
  12 notes,
  0 warnings,
  0 pipeline errors,
  extraction completed in `173.561s`

## Comparison against earlier evidence

### Narrative PDF

- Phase 1 before-state:
  the same narrative PDF produced 17 notes from 17 chunks.
  The output had clear wins over the broken Phase 0 PDF baseline, but still kept some transition-led or advice-local notes such as:
  `Transition to Communication Levels`
  and
  `Withdraw When Feeling Depressed`
- Phase 4 result:
  the same 17 chunks now produced 22 notes, which shows the intended zero/one/many extraction behavior is active instead of a forced one-note-per-chunk shape.
- Phase 4 note examples:
  `The Power of Effective Storytelling`
  `Listener's Brain Activity Anticipates Speaker's Words`
  `Language Shapes Memory Sharing`
  `Neural Mechanisms in Communication`
- Quality verdict:
  improved.
  Titles are mostly meaning-based and summaries are largely complete rather than fragmentary.

### Bounded technical real-model fixture

- Earlier technical before-state:
  the bounded short technical real-model output still collapsed several notes into generic labels such as:
  `Chunk 2`
  `Chunk 4`
  `Chunk 5`
  and
  `Chunk 6`
- Phase 4 result:
  the bounded `qwen3:8b` rerun now emits concept-led titles instead of generic chunk placeholders.
- Phase 4 note examples:
  `Defining Architectural Characteristics`
  `Understanding Software Architecture Capabilities`
  `Architectural Characteristics and Nonfunctional Requirements`
  `Trade-off Analysis in Architectural Decision Making`
- Quality verdict:
  improved.
  The technical smoke output is now reviewable as notes rather than chunk labels.

## Exit gate assessment

- `titles are meaning-based`:
  pass, with a small normalization gap still visible in `Neuralcoupling in Communication`
- `summaries are not fragmentary`:
  pass on the reviewed narrative and technical samples
- `one chunk may yield zero/one/many notes`:
  pass; the narrative rerun produced 22 notes from 17 chunks and the technical rerun produced 12 notes from 7 chunks
- `the narrative plus technical fixtures both show usable notes by the rubric`:
  pass; both outputs are useful enough to keep and review, not embarrassing or obviously broken

## Remaining gaps

- Near-duplicate narrative titles still appear:
  `Neuralcoupling in Communication`
  and
  `Neural Coupling in Communication`
- Some narrative notes remain too local or advice-shaped:
  `Avoiding Over-Identification in Communication`
  `Seek Professional Help for Persistent Mental Health Issues`
- Related-link hygiene is still weak in some notes.
- Markdown section normalization is still inconsistent between `##` and `###` headings across outputs.

## Next safe slice

Start Phase 4.5 extraction polish only:
title normalization,
duplicate concept suppression,
related-link hygiene,
markdown heading normalization,
and minor verification-path cleanup.
