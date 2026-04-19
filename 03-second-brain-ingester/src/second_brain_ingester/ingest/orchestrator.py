"""Orchestrates local source loading and chunk generation."""

from __future__ import annotations

from pathlib import Path

from second_brain_ingester.common.models import LoadedSource, ProcessedChunk
from second_brain_ingester.ingest.protocols import ChunkGenerator, SourceLoader


class IngestOrchestrator:
    def __init__(self, loaders: list[SourceLoader], chunk_generator: ChunkGenerator) -> None:
        self._loaders = loaders
        self._chunk_generator = chunk_generator

    def ingest(self, input_path: Path) -> tuple[LoadedSource, list[ProcessedChunk]]:
        loader = next(
            (candidate for candidate in self._loaders if candidate.can_load(input_path)),
            None,
        )
        if loader is None:
            raise ValueError(f"Unsupported file type: {input_path.suffix or '<none>'}")

        source = loader.load(input_path)
        chunks = self._chunk_generator.generate(source)
        if not chunks:
            raise ValueError(f"No chunks produced for {input_path}")
        return source, chunks
