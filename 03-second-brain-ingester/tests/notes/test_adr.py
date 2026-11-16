from __future__ import annotations

from second_brain_ingester.common.models import AtomicNote
from second_brain_ingester.notes.components.adr import DeterministicAdrGenerator


def test_adr_generator_adds_structured_adr_for_decision_note() -> None:
    generator = DeterministicAdrGenerator()
    notes = [
        AtomicNote(
            note_id="note-001",
            title="Architecture Notes: Trade-offs Under Constraints",
            slug="architecture-notes-trade-offs-under-constraints",
            note_type="concept",
            body=(
                "## Summary\n\n"
                "The best decision depends on the constraints you are actually carrying.\n\n"
                "## Key details\n\n"
                "- Architecture choices should be reviewed against the active system constraints."
            ),
            source_id="source-001",
            chunk_ids=["chunk-001"],
            tags=["architecture", "decision"],
            links=["Architecture Notes reference"],
            source_excerpt="The best decision depends on the constraints.",
        )
    ]

    enriched = generator.enrich(notes)

    assert len(enriched) == 2
    adr = enriched[1]
    assert adr.note_type == "adr"
    assert adr.title == "ADR 001: Architecture Notes: Trade-offs Under Constraints"
    assert adr.slug == "architecture-notes-trade-offs-under-constraints-adr"
    assert "## Context" in adr.body
    assert "## Options considered" in adr.body
    assert "## Decision" in adr.body
    assert "## Consequences" in adr.body
    assert "[[Architecture Notes: Trade-offs Under Constraints]]" in adr.body
    assert adr.tags[0] == "adr"
    assert adr.links[0] == "Architecture Notes: Trade-offs Under Constraints"


def test_adr_generator_leaves_non_decision_notes_unchanged() -> None:
    generator = DeterministicAdrGenerator()
    notes = [
        AtomicNote(
            note_id="note-002",
            title="Gardening Log: Spring Soil Prep",
            slug="gardening-log-spring-soil-prep",
            note_type="concept",
            body="## Summary\n\nAdd compost before planting.",
            source_id="source-001",
            chunk_ids=["chunk-002"],
            tags=["garden"],
            links=[],
        )
    ]

    enriched = generator.enrich(notes)

    assert enriched == notes
