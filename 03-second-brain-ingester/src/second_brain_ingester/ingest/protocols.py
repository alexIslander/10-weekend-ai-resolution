"""Protocols for local source ingestion."""

from __future__ import annotations

from pathlib import Path
from typing import Protocol

from second_brain_ingester.common.models import LoadedSource, ProcessedChunk


class SourceLoader(Protocol):
    def can_load(self, path: Path) -> bool:
        ...

    def load(self, path: Path) -> LoadedSource:
        ...


class ChunkGenerator(Protocol):
    def generate(self, source: LoadedSource) -> list[ProcessedChunk]:
        ...
