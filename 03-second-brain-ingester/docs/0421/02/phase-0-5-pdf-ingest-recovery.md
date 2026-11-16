# Phase 0.5 PDF ingest recovery

## Decision

Go. `tests/fixtures/test-anyone-ch1/HOW-TO-TALK-TO-Anyone-ch1.pdf` is now stable enough to use as the Phase 1 narrative fixture.

## Root cause

- The old `PdfSourceLoader` only scanned raw PDF bytes for literal `(...) Tj` operators.
- The failing narrative fixture stores page text in `FlateDecode` content streams with hex text operators such as `<0026> Tj` and `TJ` arrays.
- Those hex glyph codes require the page font `ToUnicode` cmap objects to decode into readable text.

## Fixture comparison

- Narrative fixture:
  `tests/fixtures/test-anyone-ch1/HOW-TO-TALK-TO-Anyone-ch1.pdf`
  had been failing with `ValueError: Unable to extract text from PDF`.
- Reference fixture:
  `tests/fixtures/test-effective-eng-ch1/Edmond-Lau-The-Effective-Engineer-Part-1-1.pdf`
  uses the same compressed hex-text pattern, so the old assumption that it was already a stable loader reference was false.
- Reference fixture:
  `tests/fixtures/test-head-first-sa-ch2/Head-First-Software-Architecture-ch2.pdf`
  already completed, but the old loader was reading it through a weaker text path and produced less trustworthy text.

## Recovery change

- Parse PDF objects and page resources instead of only scanning raw streams.
- Inflate content streams when compressed.
- Track the active page font and decode hex `Tj` and `TJ` text through the matching `ToUnicode` cmap.
- Keep the old stream-scan fallback for the simple deterministic sample fixture.

## Evidence

- Narrative loader output now includes readable phrases such as:
  `Chapter 1`
  `effective storytelling`
  and
  `neural coupling`.
- Narrative CLI smoke run now completes and writes artifacts to:
  `vault_output/devbox-app-anyone-chapter-pdf-run/how-to-talk-to-anyone-ch1-b83252c9`
- Technical reference CLI smoke run still completes and writes artifacts to:
  `vault_output/devbox-app-head-first-sa-chapter-pdf-run/head-first-software-architecture-ch2-d32643c5`

## Verification

- `devbox run pdf-recovery-test`
- `devbox run app-anyone-chapter-pdf-source`
- `devbox run app-anyone-chapter-pdf`
- `devbox run app-head-first-sa-chapter-pdf`

## Extracted-source artifact review

- Artifact path:
  `vault_output/devbox-app-anyone-chapter-pdf-source-run/how-to-talk-to-anyone-ch1-b83252c9/extracted-source.md`
- Artifact shape:
  one markdown file with source metadata plus ordered chunk separators so the text stays close to what downstream extraction sees.
- Obvious OCR or decode failures:
  no hard OCR corruption,
  no unreadable glyph soup,
  and no page-level decode failure.
  Minor spacing loss remains in a few places such as `ofcommunication` and some wrapped-word joins.
- Page-order problems:
  none observed.
  Chunk order follows page order from page 1 through page 6 without visible reordering.
- Paragraph break quality:
  good enough for review, but not clean.
  Several paragraph and sentence boundaries still flatten together, which is acceptable for Phase 1 because the remaining quality question is now chunking and extraction usefulness rather than loader failure.
- Human review verdict:
  go.
  The extracted markdown is readable enough to judge downstream model quality directly, so Phase 1 can now test the local Ollama path instead of re-testing PDF loader stability.

## Phase status

Phase 0.5 is closed. The loader failure gate is cleared, the extracted-source markdown artifact exists for the approved narrative fixture, and the reference PDF smoke run did not regress.

## Carry forward to Phase 2

- Keep `tests/fixtures/test-head-first-sa-ch2/Head-First-Software-Architecture-ch2.pdf` as the main ingest-hardening fixture.
- The extracted-source review found page order was stable, but text quality was not:
  encoding corruption such as `\222` and `\223`,
  stray symbol noise,
  sidebar and callout bleed,
  and one chunk with obvious garbage text.
- Keep `tests/fixtures/test-effective-eng-ch1/Edmond-Lau-The-Effective-Engineer-Part-1-1.txt` as the clean control sample for comparison.
- Keep `tests/fixtures/test-anyone-ch1/HOW-TO-TALK-TO-Anyone-ch1.pdf` as the acceptable-but-still-noisy narrative PDF reference:
  readable enough for Phase 1,
  but still showing paragraph flattening and joined-word spacing loss.
- Phase 2 should target PDF ingest hardening only:
  improve decode quality,
  reduce layout noise,
  and preserve the current stable page order.

## Next safe slice

Start Phase 1 only. Keep scope on one real Ollama-backed narrative PDF run using the approved `HOW-TO-TALK-TO-Anyone-ch1.pdf` fixture and the same Phase 0 rubric for comparison.
