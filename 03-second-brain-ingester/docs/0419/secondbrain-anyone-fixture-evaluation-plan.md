# Second Brain Anyone Fixture Evaluation Plan

## Goal

Use the new `HOW-TO-TALK-TO-Anyone` fixtures to measure and improve note quality for book-like inputs, with explicit focus on chunk boundaries, atomic note quality, low-value front matter handling, and linker precision.

## KISS Approach

1. Freeze the current outputs from `test-anyone-ch1`, `test-anyone-until-ch1`, and `test-anyone-until-ch3` as the baseline so later changes can be compared against a known result.
2. Define a small manual evaluation rubric for atomicity, title quality, summary quality, chunk-boundary integrity, and link quality before changing the pipeline.
3. Run that rubric on the three fixtures and record where the current behavior fails:
   truncated ideas, sentence-midpoint splits, noisy prefatory material, over-broad links, and one-chunk-one-note artifacts.
4. Improve chunking and extraction in the smallest order that changes note quality materially:
   boundary-aware chunking first, then extraction constraints, then linker tuning.
5. Re-run the same fixtures after each slice and compare note counts, broken-note counts, and clearly wrong links to the baseline.

## Scope

- In scope: evaluating and improving note generation for the three `HOW-TO-TALK-TO-Anyone` fixtures already added under `tests/fixtures/`.
- In scope: deterministic dry-run evaluation using current Devbox scripts and vault outputs.
- In scope: chunk quality, atomic note semantics, title quality, summary quality, and linker precision/recall at a practical level.
- Out of scope: live-model prompt optimization, vector search, MOC strategy, ADR generation, and broad architecture changes unrelated to fixture quality.
- Stay unchanged: the fixture source files themselves should remain stable so they can serve as regression data.
- Constraint: each follow-up slice must produce a durable before/after comparison using the same fixture set.

## Execution Inputs

- Fixture set:
  `tests/fixtures/test-anyone-ch1/`
  `tests/fixtures/test-anyone-until-ch1/`
  `tests/fixtures/test-anyone-until-ch3/`
- Current output references:
  `vault_output/devbox-app-anyone-chapter-run/`
  `vault_output/devbox-app-anyone-chapter-linker-run/`
- Existing implementation references:
  `src/second_brain_ingester/ingest/components/chunk_normalizer.py`
  `src/second_brain_ingester/notes/components/extractor.py`
  `src/second_brain_ingester/notes/components/linker.py`

## Expected Outcome

- The project gains a repeatable way to judge whether generated notes are truly atomic instead of merely chunk-shaped.
- Book-like inputs produce notes that preserve complete thoughts rather than arbitrary text windows.
- Linker output becomes more trustworthy because it operates on better note units and tighter note metadata.
- The fixture set becomes a regression harness for future agent phases instead of a one-off manual smoke test.

## Evaluation rubric

- Atomicity: each note should represent one coherent claim, mechanism, example, tactic, or warning.
- Boundary integrity: a note should not begin or end in a way that depends on missing text from an adjacent chunk.
- Title quality: the title should express the idea, not echo the first six content words.
- Summary quality: the summary should state the point of the note, not just repeat the first sentence fragment.
- Relevance handling: front matter, filler, and setup text should not dominate note count when later sections carry the useful material.
- Link quality: links should connect substantively related notes, not just notes sharing generic words such as `brain`, `story`, or `communication`.

## Phase plan

### Phase 1: Baseline scoring

- Phase gate: the three fixtures and current dry-run scripts are present.
- Exit gate: a short written baseline exists for all three fixtures covering note count, broken-note count, weak-title count, and obviously weak links.
- Phase output: a named baseline evaluation note under `docs/0419/` or a paired checklist update that records current behavior.
- Test strategy: manual review of a limited sample plus simple deterministic counts is sufficient because this is a discovery phase.
- Manual test: inspect at least five notes per fixture and tag each as `good atomic`, `borderline`, or `broken`.

### Phase 2: Boundary-aware chunking

- Phase gate: baseline scoring identifies sentence-midpoint and idea-midpoint splits as a material problem.
- Exit gate: chunking prefers paragraph and sentence boundaries before falling back to hard width limits.
- Phase output: updated chunking rules plus fixture reruns showing fewer broken notes.
- Test strategy: one focused chunker test for sentence preservation and one integration rerun on `test-anyone-ch1`.
- Manual test: verify that notes no longer start with fragments such as `brain.`, `brains.`, `well.`, or `the point.` unless that fragment is a complete intended note.

### Phase 3: Atomic extraction rules

- Phase gate: chunk boundaries are improved enough that extraction quality is no longer dominated by broken input windows.
- Exit gate: extraction can produce note titles and summaries from the meaning of the chunk rather than from its opening words only.
- Phase output: clearer note titles, clearer summaries, and either one or multiple notes per chunk when the chunk contains multiple ideas.
- Test strategy: one extractor contract test for title/summary shape and one fixture-based integration check on representative book content.
- Manual test: confirm each output note can be answered by the question, `What single idea is this note trying to preserve?`

### Phase 4: Low-value material handling

- Phase gate: the pipeline can already produce cleaner notes from single-chapter inputs.
- Exit gate: multi-chapter fixture runs show reduced note pollution from low-signal introductory or repetitive material.
- Phase output: a documented policy for how the ingester treats prefaces, introductions, recap text, and weakly relevant sections.
- Test strategy: one deterministic relevance filter test and one comparison between `test-anyone-ch1` and `test-anyone-until-ch3`.
- Manual test: verify that the note set for `until-ch3` is not just a scaled-up version of low-value lead-in content.

### Phase 5: Linker precision tuning

- Phase gate: atomic note boundaries and titles are stable enough to support meaningful linking.
- Exit gate: linker output favors conceptually related notes and avoids links driven only by repeated generic vocabulary.
- Phase output: improved deterministic linker heuristics and a small fixture-based review set for link quality.
- Test strategy: one targeted linker test for false-positive suppression and one integration rerun on the chapter fixture.
- Manual test: inspect each linked note and ask, `Would a reader actually want to navigate to this note from here?`

## Recommended acceptance thresholds

- Fewer than 10 percent of notes in `test-anyone-ch1` should be obviously broken fragments.
- No note title should be a meaningless leading-word extraction.
- No summary should be a single stray word unless the source itself is intentionally that short.
- Linked-note sections should contain mostly navigationally useful links when reviewed manually on a chapter-sized fixture.
- `until-ch1` and `until-ch3` should prove that additional book context does not degrade note quality disproportionately.

## Practical next slice

- Start with `test-anyone-ch1` only.
- Score the current output against the rubric.
- Fix chunk boundaries before touching the linker again.
- Re-run `app-anyone-chapter` and `app-anyone-chapter-linker`.
- Only after note units improve, expand the same evaluation to `until-ch1` and `until-ch3`.
