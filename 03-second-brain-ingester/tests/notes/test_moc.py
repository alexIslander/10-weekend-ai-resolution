from __future__ import annotations

from second_brain_ingester.common.models import AtomicNote
from second_brain_ingester.notes.components.moc import DeterministicMocGenerator


def test_moc_generator_adds_map_of_content_note() -> None:
    generator = DeterministicMocGenerator()
    notes = [
        AtomicNote(
            note_id="note-001",
            title="Communication Notes: Neural Coupling",
            slug="communication-notes-neural-coupling",
            note_type="concept",
            body=(
                "## Summary\n\n"
                "Neural coupling helps speakers and listeners sync around the same story.\n\n"
                "## Key details\n\n"
                "- Shared understanding depends on meaningful alignment."
            ),
            source_id="source-001",
            chunk_ids=["chunk-001"],
            tags=["communication", "neuroscience"],
            links=["Communication Notes: Shared Stories"],
            source_excerpt="Neural coupling helps speakers and listeners sync.",
        ),
        AtomicNote(
            note_id="note-002",
            title="Communication Notes: Shared Stories",
            slug="communication-notes-shared-stories",
            note_type="concept",
            body=(
                "## Summary\n\n"
                "Stories create shared context that listeners can retain and reuse.\n\n"
                "## Key details\n\n"
                "- Narrative coherence changes how people interpret facts."
            ),
            source_id="source-001",
            chunk_ids=["chunk-002"],
            tags=["communication", "storytelling"],
            links=["Communication Notes: Neural Coupling"],
            source_excerpt="Stories create shared context.",
        ),
        AtomicNote(
            note_id="note-002-adr",
            title="ADR 001: Communication Notes: Shared Stories",
            slug="communication-notes-shared-stories-adr",
            note_type="adr",
            body="## Decision\n\nAdopt narrative structure when context matters.",
            source_id="source-001",
            chunk_ids=["chunk-002"],
            tags=["adr", "communication"],
            links=["Communication Notes: Shared Stories"],
        ),
    ]

    enriched = generator.enrich(notes)

    assert len(enriched) == 4
    moc = enriched[-1]
    assert moc.note_type == "moc"
    assert moc.title == "MOC: source-001"
    assert "## Start here" in moc.body
    assert "## Themes" in moc.body
    assert "## ADR notes" in moc.body
    assert "```mermaid" in moc.body
    assert "mindmap" in moc.body
    assert "[[Communication Notes: Neural Coupling]]" in moc.body


def test_moc_generator_keeps_existing_notes_unchanged() -> None:
    generator = DeterministicMocGenerator()
    notes = [
        AtomicNote(
            note_id="note-001",
            title="Architecture Notes: Trade-offs Under Constraints",
            slug="architecture-notes-trade-offs-under-constraints",
            note_type="concept",
            body="## Summary\n\nTrade-offs should be reviewed against active constraints.",
            source_id="source-001",
            chunk_ids=["chunk-001"],
            tags=["architecture", "decision"],
            links=["Architecture Notes reference"],
        ),
        AtomicNote(
            note_id="note-001-srq",
            title="SRQ: Architecture Notes: Trade-offs Under Constraints",
            slug="architecture-notes-trade-offs-under-constraints-srq",
            note_type="srq",
            body="## Question\n\nHow do I review this trade-off?",
            source_id="source-001",
            chunk_ids=["chunk-001"],
            tags=["srq", "architecture"],
            links=["Architecture Notes: Trade-offs Under Constraints"],
        ),
    ]

    enriched = generator.enrich(notes)

    assert enriched[:2] == notes
    assert enriched[-1].note_type == "moc"
