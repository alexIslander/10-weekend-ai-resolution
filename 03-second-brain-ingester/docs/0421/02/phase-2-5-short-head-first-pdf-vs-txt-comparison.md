# Phase 2.5 short Head First PDF vs txt comparison

## Status

- Date: 2026-04-23
- Phase: `Phase 2.5: Runtime visibility and loader decomposition`
- Purpose: compare the short technical PDF extracted-source markdown artifact against the checked-in `.txt` fixture before using a bounded real-model smoke path.

## Compared files

- PDF extracted-source artifact:
  [extracted-source.md](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/vault_output/devbox-01-head-first-sa-chapter-short-pdf-source-run/head-first-software-architecture-ch2-short-529bf3a8/extracted-source.md)
- Checked-in text fixture:
  [Head-First-Software-Architecture-ch2-short.txt](/Users/scsete/workspace/2026/10-weekend-ai-resolution/03-second-brain-ingester/tests/fixtures/test-head-first-sa-ch2-short/Head-First-Software-Architecture-ch2-short.txt)

## Findings

- The checked-in `.txt` fixture is materially cleaner than the PDF extracted-source markdown content.
- The extracted markdown is still useful as an ingest-debug artifact, but not as the better content source for bounded real-model verification.
- The extracted markdown includes wrapper metadata, warnings, and chunk headings, so it is not a raw text-equivalent comparison target.
- The underlying extracted PDF text shows layout and decode noise that the `.txt` fixture avoids.

## Concrete differences

- Page-number and heading joins are noisier in the PDF path:
  `.txt` keeps `this is a new chapter 4 41`,
  while the extracted markdown content collapses it to `this is a new chapter 41What does your architecture need to support?`
- Stylized text degrades more in the PDF path:
  `.txt` shows `Causing Lafter`,
  while the extracted markdown content shows `& D X V L Q J / D I W H U`
- Side-label artifact bleed remains in the PDF path:
  `.txt` shows `A pretty standard level of detail for a requirements document`,
  while the extracted markdown content shows `en-USA pretty standard level of detail for a requirements document`
- Diagram or callout labels are much noisier in the PDF path:
  `.txt` shows `Cubicle conversation Mara Sam Alex`,
  while the extracted markdown content shows `& X E L F O H F R Q Y H U V D W L R QMaraSamAlexen-US`

## Decision

- Use the checked-in `.txt` fixture as the better bounded real-model smoke input for the short technical slice.
- Keep the PDF extracted-source markdown artifact as evidence for ingest quality and as a future baseline when chunking work begins.

## Phase 3 note

When `Phase 3: Boundary-aware chunking` starts, consider adding a clean markdown extraction step before chunk optimization on noisy PDF inputs. A cleaner pre-chunk markdown artifact may reduce broken starts and mixed-content fragmentation before the chunker is evaluated, especially on the technical PDF path.
