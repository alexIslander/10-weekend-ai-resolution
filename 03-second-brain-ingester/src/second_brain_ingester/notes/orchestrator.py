"""Coordinates deterministic note extraction."""

from __future__ import annotations

from second_brain_ingester.common.models import AtomicNote, ProcessedChunk, SourceMetadata
from second_brain_ingester.notes.protocols import NoteEnricher, NoteExtractor


class NotesOrchestrator:
    def __init__(
        self,
        extractor: NoteExtractor,
        enrichers: list[NoteEnricher] | None = None,
    ) -> None:
        self._extractor = extractor
        self._enrichers = enrichers or []

    def create_notes(
        self,
        chunks: list[ProcessedChunk],
        source_metadata: SourceMetadata,
    ) -> list[AtomicNote]:
        notes = self._extractor.extract(chunks, source_metadata)
        for enricher in self._enrichers:
            notes = enricher.enrich(notes)
        return notes
