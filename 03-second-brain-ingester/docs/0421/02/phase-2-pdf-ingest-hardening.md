# Phase 2 PDF ingest hardening

## Decision

Go. Phase 2 is closed on 2026-04-22.

## Scope kept

- Ingest only.
- No chunking changes.
- No extractor prompt changes.
- No routing or orchestration changes.

## What changed

- Hardened `PdfSourceLoader` literal-string decoding so PDF octal escapes now decode into readable punctuation instead of surfacing as raw sequences such as `\222` and `\223`.
- Applied page font cmap decoding to literal PDF strings in addition to hex strings so mixed-content technical pages decode more readably.
- Stripped control-glyph debris from extracted page text while keeping page order stable.
- Added explicit per-page warnings when control glyphs were stripped so technical-PDF degradation is visible instead of silent.
- Added the warning list to the extracted-source markdown artifact so manual review can see parser behavior directly.
- Added bounded Phase 2 regression coverage and a dedicated Devbox command.

## Evidence

- Technical fixture:
  `tests/fixtures/test-head-first-sa-ch2/Head-First-Software-Architecture-ch2.pdf`
- Updated extracted-source artifact:
  `vault_output/devbox-app-head-first-sa-chapter-pdf-run/head-first-software-architecture-ch2-d32643c5/extracted-source.md`
- Loader output no longer contains the escaped-punctuation artifacts that Phase 0.5 carried forward:
  `\222: 0`
  `\223: 0`
  `\224: 0`
  `\205: 0`
  `\227: 0`
- The technical artifact now shows readable punctuation in previously degraded passages, for example:
  `Users can add new content on Lafter as a “Joke”`
  `The good news is that they’ve got the logo figured out.`
- The technical artifact still contains mixed-content layout noise such as `en-US` labels and some decorative heading bleed, but that noise is now accompanied by explicit per-page warnings instead of being silent.

## Verification

- `devbox run --recompute=false phase-2-ingest-test`
- `devbox run --recompute=false app-head-first-sa-chapter-pdf-source`
- `devbox run --recompute=false app-anyone-chapter-pdf`

## Outcome against the phase gate

- Narrative PDF still completes on the existing local ingest path.
- Technical PDF completes with explicit parser behavior.
- Parser warnings are durable in both loader state and extracted-source markdown.
- The technical PDF no longer degrades through silent escaped-punctuation failure.

## Remaining gap

- This slice did not solve mixed-content layout bleed such as `en-US` labels, decorative heading text, or embedded diagram/sidebar noise.
- The custom PDF loader still does not preserve tables or images as bounded artifacts.
- The real technical PDF Ollama path is still operationally unvalidated:
  `devbox run app-head-first-sa-chapter-pdf-source-ollama` may run for 30 minutes or longer without visible status or final output,
  so this closeout should not be read as proof that the real-model technical fixture is operationally acceptable.
- Those remaining issues should be handled later without reopening this ingest-only closeout.

## Next safe slice

Start Phase 2.5 only. Keep scope on runtime visibility for long-running runs and loader decomposition before chunking work.
