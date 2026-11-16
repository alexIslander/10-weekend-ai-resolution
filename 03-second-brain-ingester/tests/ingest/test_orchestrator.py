from __future__ import annotations

from pathlib import Path

from second_brain_ingester.common.models import LoadedSource, ProcessedChunk
from second_brain_ingester.ingest.orchestrator import IngestOrchestrator


class FakeLoader:
    def can_load(self, path: Path) -> bool:
        return path.suffix == ".txt"

    def load(self, path: Path) -> LoadedSource:
        return LoadedSource(metadata=object(), units=[])  # type: ignore[arg-type]


class FakeChunkGenerator:
    def generate(self, source: LoadedSource) -> list[ProcessedChunk]:
        return [
            ProcessedChunk(
                chunk_id="chunk-001",
                source_id="source-001",
                ordinal=1,
                text="body",
                title="Chunk 1",
            )
        ]


def test_ingest_orchestrator_uses_matching_loader() -> None:
    orchestrator = IngestOrchestrator(loaders=[FakeLoader()], chunk_generator=FakeChunkGenerator())

    _, chunks = orchestrator.ingest(Path("sample.txt"))

    assert chunks[0].chunk_id == "chunk-001"
