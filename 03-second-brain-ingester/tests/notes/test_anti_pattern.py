from __future__ import annotations

from second_brain_ingester.common.models import AtomicNote
from second_brain_ingester.notes.components.anti_pattern import DeterministicAntiPatternGenerator


def test_anti_pattern_generator_adds_warning_note_per_concept_note() -> None:
    generator = DeterministicAntiPatternGenerator()
    notes = [
        AtomicNote(
            note_id="note-001",
            title="Communication Notes: Neural Coupling",
            slug="communication-notes-neural-coupling",
            note_type="concept",
            body=(
                "## Summary\n\n"
                "Shared understanding improves when speakers and listeners align on the same idea.\n\n"
                "## Key details\n\n"
                "- Useful in teaching."
            ),
            source_id="source-001",
            chunk_ids=["chunk-001"],
            tags=["communication", "learning"],
            links=["Communication Notes reference"],
            source_excerpt="Shared understanding improves.",
        )
    ]

    enriched = generator.enrich(notes)

    assert len(enriched) == 2
    anti_pattern = enriched[1]
    assert anti_pattern.note_type == "anti-pattern"
    assert anti_pattern.title == "Anti-pattern: Communication Notes: Neural Coupling"
    assert anti_pattern.slug == "communication-notes-neural-coupling-anti-pattern"
    assert "## Failure mode" in anti_pattern.body
    assert "[[Communication Notes: Neural Coupling]]" in anti_pattern.body
    assert anti_pattern.tags[0] == "anti-pattern"
    assert anti_pattern.links[0] == "Communication Notes: Neural Coupling"
