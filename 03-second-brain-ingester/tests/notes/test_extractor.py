from __future__ import annotations

from pathlib import Path

from second_brain_ingester.common.models import (
    ExtractedNoteDraft,
    ExtractionResponse,
    ProcessedChunk,
    SourceMetadata,
)
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
                        summary=(
                            "Architectural characteristics define what the system must support."
                        ),
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


def test_extractor_fixes_merged_title_words() -> None:
    class FakeClient:
        def complete(self, _request: object) -> ExtractionResponse:
            return ExtractionResponse(
                chunk_id="chunk-004",
                raw_payload='{"notes":[...]}',
                notes=[
                    ExtractedNoteDraft(
                        title="Neuralcoupling in Communication",
                        summary="Neural coupling helps listeners mirror a speaker's meaning.",
                        body="Listeners align with a speaker's framing during vivid storytelling.",
                        links=["Communication concepts"],
                    )
                ],
            )

    extractor = StructuredNoteExtractor(
        client=FakeClient(),
        prompt_text="phase-4-5-test-prompt",
    )

    notes = extractor.extract(
        chunks=[
            ProcessedChunk(
                chunk_id="chunk-004",
                source_id="source-001",
                ordinal=4,
                text="Neural coupling helps listeners mirror a speaker's meaning.",
                title="Chunk 4",
            )
        ],
        source_metadata=_source_metadata(),
    )

    assert notes[0].title == "Neural Coupling in Communication"
    assert notes[0].slug == "neural-coupling-in-communication"


def test_extractor_suppresses_duplicate_concept_titles_after_normalization() -> None:
    class FakeClient:
        def complete(self, _request: object) -> ExtractionResponse:
            return ExtractionResponse(
                chunk_id="chunk-005",
                raw_payload='{"notes":[...]}',
                notes=[
                    ExtractedNoteDraft(
                        title="Neuralcoupling in Communication",
                        summary="Neural coupling helps listeners mirror a speaker's meaning.",
                        body="Listeners align with a speaker's framing during vivid storytelling.",
                    ),
                    ExtractedNoteDraft(
                        title="Neural Coupling in Communication",
                        summary="Neural coupling helps listeners mirror a speaker's meaning.",
                        body="Neural coupling describes listener alignment with a speaker.",
                    ),
                ],
            )

    extractor = StructuredNoteExtractor(
        client=FakeClient(),
        prompt_text="phase-4-5-test-prompt",
    )

    notes = extractor.extract(
        chunks=[
            ProcessedChunk(
                chunk_id="chunk-005",
                source_id="source-001",
                ordinal=5,
                text="Neural coupling helps listeners mirror a speaker's meaning.",
                title="Chunk 5",
            )
        ],
        source_metadata=_source_metadata(),
    )

    assert len(notes) == 1
    assert notes[0].title == "Neural Coupling in Communication"


def test_extractor_cleans_placeholder_and_malformed_related_links() -> None:
    class FakeClient:
        def complete(self, _request: object) -> ExtractionResponse:
            return ExtractionResponse(
                chunk_id="chunk-006",
                raw_payload='{"notes":[...]}',
                notes=[
                    ExtractedNoteDraft(
                        title="Storytelling Builds Trust",
                        summary="Storytelling can help people build trust quickly.",
                        body="Vivid stories make a listener feel aligned with the speaker.",
                        links=[
                            "",
                            "Active Listening Techniques",
                            "[[Storytelling Trust]]",
                            "[[ ]]",
                            "Storytelling Trust",
                        ],
                    )
                ],
            )

    extractor = StructuredNoteExtractor(
        client=FakeClient(),
        prompt_text="phase-4-5-test-prompt",
    )

    notes = extractor.extract(
        chunks=[
            ProcessedChunk(
                chunk_id="chunk-006",
                source_id="source-001",
                ordinal=6,
                text="Storytelling can help people build trust quickly.",
                title="Chunk 6",
            )
        ],
        source_metadata=_source_metadata(),
    )

    assert notes[0].links == ["Storytelling Trust"]
    assert "- [[Storytelling Trust]]" in notes[0].body
    assert "Active Listening Techniques" not in notes[0].body


def test_extractor_normalizes_note_body_heading_shape() -> None:
    class FakeClient:
        def complete(self, _request: object) -> ExtractionResponse:
            return ExtractionResponse(
                chunk_id="chunk-007",
                raw_payload='{"notes":[...]}',
                notes=[
                    ExtractedNoteDraft(
                        title="Conversation Energy",
                        summary="Conversation energy changes how messages are received.",
                        body=(
                            "### Summary\n\n"
                            "Conversation energy changes how messages are received.\n\n"
                            "### Key details\n\n"
                            "- Tone affects interpretation.\n"
                            "- Timing changes impact.\n\n"
                            "### Related links\n\n"
                            "- [[Active Listening Techniques]]\n\n"
                            "### Source excerpt\n\n"
                            "Tone and timing matter."
                        ),
                        links=["Conversation Tone"],
                        source_excerpt="Tone and timing matter.",
                    )
                ],
            )

    extractor = StructuredNoteExtractor(
        client=FakeClient(),
        prompt_text="phase-4-5-test-prompt",
    )

    notes = extractor.extract(
        chunks=[
            ProcessedChunk(
                chunk_id="chunk-007",
                source_id="source-001",
                ordinal=7,
                text="Conversation energy changes how messages are received.",
                title="Chunk 7",
            )
        ],
        source_metadata=_source_metadata(),
    )

    assert "### Summary" not in notes[0].body
    assert notes[0].body.count("## Summary") == 1
    assert notes[0].body.count("## Key details") == 1
    assert notes[0].body.count("## Related links") == 1
    assert "- [[Conversation Tone]]" in notes[0].body


def test_extractor_progress_uses_stable_chunk_labels() -> None:
    class FakeClient:
        def complete(self, _request: object) -> ExtractionResponse:
            return ExtractionResponse(
                chunk_id="chunk-008",
                raw_payload='{"notes":[]}',
                notes=[],
            )

    progress_messages: list[str] = []
    extractor = StructuredNoteExtractor(
        client=FakeClient(),
        prompt_text="phase-4-5-test-prompt",
        progress_callback=progress_messages.append,
    )

    extractor.extract(
        chunks=[
            ProcessedChunk(
                chunk_id="chunk-008",
                source_id="source-001",
                ordinal=8,
                text="Text",
                title="Ch8",
                page_number=1,
            )
        ],
        source_metadata=_source_metadata(),
    )

    assert progress_messages == [
        "Extracting chunk 1/1: Page 1 chunk 8",
        "Completed chunk 1/1: Page 1 chunk 8",
    ]


def _source_metadata() -> SourceMetadata:
    return SourceMetadata(
        source_id="source-001",
        source_type="text",
        input_path=Path("sample.txt"),
        title="Architecture Notes",
        checksum_sha256="abc123",
        byte_size=12,
    )
