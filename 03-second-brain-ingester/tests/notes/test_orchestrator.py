from __future__ import annotations

from second_brain_ingester.common.models import AtomicNote, ProcessedChunk, SourceMetadata
from second_brain_ingester.notes.orchestrator import NotesOrchestrator


class FakeExtractor:
    def extract(
        self,
        chunks: list[ProcessedChunk],
        source_metadata: SourceMetadata,
    ) -> list[AtomicNote]:
        return [
            AtomicNote(
                note_id="note-001",
                title="Note 1",
                slug="note-1",
                note_type="concept",
                body="body",
                source_id=source_metadata.source_id,
                chunk_ids=[chunks[0].chunk_id],
            )
        ]


class FakeEnricher:
    def enrich(self, notes: list[AtomicNote]) -> list[AtomicNote]:
        enriched = list(notes)
        enriched[0].tags.append("enriched")
        return enriched


def test_notes_orchestrator_runs_extractor_and_enrichers() -> None:
    source_metadata = SourceMetadata(
        source_id="source-001",
        source_type="text",
        input_path="sample.txt",  # type: ignore[arg-type]
        title="Sample",
        checksum_sha256="abc123",
        byte_size=12,
    )
    chunks = [
        ProcessedChunk(
            chunk_id="chunk-001",
            source_id="source-001",
            ordinal=1,
            text="body",
            title="Chunk 1",
        )
    ]
    orchestrator = NotesOrchestrator(extractor=FakeExtractor(), enrichers=[FakeEnricher()])

    notes = orchestrator.create_notes(chunks, source_metadata)

    assert notes[0].tags == ["enriched"]
