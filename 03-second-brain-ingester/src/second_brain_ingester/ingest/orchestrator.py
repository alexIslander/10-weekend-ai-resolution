"""Orchestrates local source loading and chunk generation."""

from __future__ import annotations

from pathlib import Path

from second_brain_ingester.common.models import LoadedSource, ProcessedChunk
from second_brain_ingester.ingest.protocols import ChunkGenerator, SourceLoader


class IngestOrchestrator:
    def __init__(self, loaders: list[SourceLoader], chunk_generator: ChunkGenerator) -> None:
        self._loaders = loaders
        self._chunk_generator = chunk_generator

    def _resolve_loader(self, input_path: Path) -> SourceLoader:
        loader = next(
            (candidate for candidate in self._loaders if candidate.can_load(input_path)),
            None,
        )
        if loader is None:
            raise ValueError(f"Unsupported file type: {input_path.suffix or '<none>'}")
        return loader

    def load_source(self, input_path: Path) -> LoadedSource:
        return self._resolve_loader(input_path).load(input_path)

    def generate_chunks(self, source: LoadedSource, input_path: Path) -> list[ProcessedChunk]:
        chunks = self._chunk_generator.generate(source)
        if not chunks:
            raise ValueError(f"No chunks produced for {input_path}")
        return chunks

    def ingest(self, input_path: Path) -> tuple[LoadedSource, list[ProcessedChunk]]:
        source = self.load_source(input_path)
        chunks = self.generate_chunks(source, input_path)
        return source, chunks
