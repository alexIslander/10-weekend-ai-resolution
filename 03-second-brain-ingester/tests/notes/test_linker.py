from __future__ import annotations

from second_brain_ingester.common.models import AtomicNote
from second_brain_ingester.notes.components.linker import DeterministicNoteLinker


def test_linker_adds_related_note_titles_and_body_section() -> None:
    linker = DeterministicNoteLinker(max_links_per_note=2)
    notes = [
        AtomicNote(
            note_id="note-001",
            title="Architecture Notes: Trade Offs Under Constraints",
            slug="trade-offs-under-constraints",
            note_type="concept",
            body="## Summary\n\nDecision quality depends on context.",
            source_id="source-001",
            chunk_ids=["chunk-001"],
            tags=["architecture", "constraints"],
            links=["Architecture Notes reference"],
        ),
        AtomicNote(
            note_id="note-002",
            title="Architecture Notes: Constraints Shape Decisions",
            slug="constraints-shape-decisions",
            note_type="concept",
            body="## Summary\n\nConstraints define trade-offs.",
            source_id="source-001",
            chunk_ids=["chunk-002"],
            tags=["architecture", "tradeoffs"],
        ),
        AtomicNote(
            note_id="note-003",
            title="Gardening Log: Spring Soil Prep",
            slug="spring-soil-prep",
            note_type="concept",
            body="## Summary\n\nUnrelated note.",
            source_id="source-001",
            chunk_ids=["chunk-003"],
            tags=["garden"],
        ),
    ]

    enriched = linker.enrich(notes)

    assert enriched[0].links == [
        "Architecture Notes reference",
        "Architecture Notes: Constraints Shape Decisions",
    ]
    assert "## Linked notes" in enriched[0].body
    assert "[[Architecture Notes: Constraints Shape Decisions]]" in enriched[0].body
    assert enriched[2].links == []
