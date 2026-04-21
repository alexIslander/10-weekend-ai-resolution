from __future__ import annotations

from second_brain_ingester.common.models import AtomicNote
from second_brain_ingester.notes.components.srq import DeterministicSrqGenerator


def test_srq_generator_adds_question_note_per_concept_note() -> None:
    generator = DeterministicSrqGenerator()
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
    srq = enriched[1]
    assert srq.note_type == "srq"
    assert srq.title == "SRQ: Communication Notes: Neural Coupling"
    assert srq.slug == "communication-notes-neural-coupling-srq"
    assert "## Question" in srq.body
    assert "[[Communication Notes: Neural Coupling]]" in srq.body
    assert srq.tags[0] == "srq"
    assert srq.links[0] == "Communication Notes: Neural Coupling"
