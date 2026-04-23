from __future__ import annotations

from pathlib import Path

from second_brain_ingester.common.models import ProcessedChunk, SourceMetadata
from second_brain_ingester.common.models import ExtractedNoteDraft, ExtractionResponse
from second_brain_ingester.notes.components.api_client import DryRunStructuredExtractionClient
from second_brain_ingester.notes.components.extractor import (
    StructuredNoteExtractor,
    load_extractor_prompt,
)


def test_extractor_returns_atomic_notes_from_chunks() -> None:
    prompt_path = Path("src/second_brain_ingester/notes/prompts/extractor.md")
    extractor = StructuredNoteExtractor(
        client=DryRunStructuredExtractionClient(prompt_path=prompt_path),
        prompt_text=load_extractor_prompt(prompt_path),
    )

    notes = extractor.extract(
        chunks=[
            ProcessedChunk(
                chunk_id="chunk-001",
                source_id="source-001",
                ordinal=1,
                text="Fitness functions keep architectural decisions measurable.",
                title="Chunk 1",
            )
        ],
        source_metadata=SourceMetadata(
            source_id="source-001",
            source_type="text",
            input_path=Path("sample.txt"),
            title="Architecture Notes",
            checksum_sha256="abc123",
            byte_size=12,
        ),
    )

    assert len(notes) == 1
    assert notes[0].chunk_ids == ["chunk-001"]
    assert notes[0].links == ["Architecture Notes reference"]
    assert "## Summary" in notes[0].body


def test_extractor_normalizes_generic_titles_and_unstructured_bodies() -> None:
    class FakeClient:
        def complete(self, _request: object) -> ExtractionResponse:
            return ExtractionResponse(
                chunk_id="chunk-002",
                raw_payload='{"notes":[...]}',
                notes=[
                    ExtractedNoteDraft(
                        title="Chunk 2",
                        summary="Architectural characteristics define what the system must support.",
                        body=(
                            "Architectural characteristics shape design choices "
                            "before an architectural style is selected."
                        ),
                        links=["Architectural characteristics"],
                        source_excerpt=(
                            "architectural characteristics are the fundamental "
                            "building blocks of any system"
                        ),
                    )
                ],
            )

    extractor = StructuredNoteExtractor(
        client=FakeClient(),
        prompt_text="phase-4-test-prompt",
    )

    notes = extractor.extract(
        chunks=[
            ProcessedChunk(
                chunk_id="chunk-002",
                source_id="source-001",
                ordinal=2,
                text="Architectural characteristics are the fundamental building blocks.",
                title="Chunk 2",
            )
        ],
        source_metadata=SourceMetadata(
            source_id="source-001",
            source_type="text",
            input_path=Path("sample.txt"),
            title="Architecture Notes",
            checksum_sha256="abc123",
            byte_size=12,
        ),
    )

    assert notes[0].title == "Architectural characteristics define what the system must support"
    assert "## Summary" in notes[0].body
    assert "## Key details" in notes[0].body
    assert "## Related links" in notes[0].body
    assert "## Source excerpt" in notes[0].body


def test_extractor_allows_zero_note_chunks() -> None:
    class FakeClient:
        def complete(self, _request: object) -> ExtractionResponse:
            return ExtractionResponse(
                chunk_id="chunk-003",
                raw_payload='{"notes":[]}',
                notes=[],
            )

    extractor = StructuredNoteExtractor(
        client=FakeClient(),
        prompt_text="phase-4-test-prompt",
    )

    notes = extractor.extract(
        chunks=[
            ProcessedChunk(
                chunk_id="chunk-003",
                source_id="source-001",
                ordinal=3,
                text="With all that in mind, let us move on to the next topic.",
                title="Chunk 3",
            )
        ],
        source_metadata=SourceMetadata(
            source_id="source-001",
            source_type="text",
            input_path=Path("sample.txt"),
            title="Architecture Notes",
            checksum_sha256="abc123",
            byte_size=12,
        ),
    )

    assert notes == []
