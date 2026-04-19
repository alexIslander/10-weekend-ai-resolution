from __future__ import annotations

from pathlib import Path

from second_brain_ingester.ingest.components.chunk_normalizer import DeterministicChunkGenerator
from second_brain_ingester.ingest.components.text_loader import TextSourceLoader


def test_chunk_generator_emits_deterministic_chunk_ids() -> None:
    source = TextSourceLoader().load(Path("tests/fixtures/sample.txt"))
    generator = DeterministicChunkGenerator(max_chunk_chars=80)

    first_run = generator.generate(source)
    second_run = generator.generate(source)

    assert [chunk.chunk_id for chunk in first_run] == [chunk.chunk_id for chunk in second_run]
    assert len(first_run) >= 3
