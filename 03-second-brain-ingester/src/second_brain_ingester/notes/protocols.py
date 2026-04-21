"""Protocols for note extraction and enrichment."""

from __future__ import annotations

from typing import Protocol

from second_brain_ingester.common.models import AtomicNote, ProcessedChunk, SourceMetadata


class NoteExtractor(Protocol):
    def extract(
        self,
        chunks: list[ProcessedChunk],
        source_metadata: SourceMetadata,
    ) -> list[AtomicNote]:
        ...


class NoteEnricher(Protocol):
    def enrich(self, notes: list[AtomicNote]) -> list[AtomicNote]:
        ...


class NoteLinker(Protocol):
    def enrich(self, notes: list[AtomicNote]) -> list[AtomicNote]:
        ...


class AdrGenerator(Protocol):
    def enrich(self, notes: list[AtomicNote]) -> list[AtomicNote]:
        ...


class MocGenerator(Protocol):
    def enrich(self, notes: list[AtomicNote]) -> list[AtomicNote]:
        ...
