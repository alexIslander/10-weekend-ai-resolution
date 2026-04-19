from __future__ import annotations

from pathlib import Path

from second_brain_ingester.common.models import ProcessedChunk, SourceMetadata
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
