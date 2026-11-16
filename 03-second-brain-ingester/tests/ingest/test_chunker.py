from __future__ import annotations

from pathlib import Path

from second_brain_ingester.common.models import LoadedSource, RawContentUnit, SourceMetadata
from second_brain_ingester.ingest.components.chunk_normalizer import DeterministicChunkGenerator
from second_brain_ingester.ingest.components.text_loader import TextSourceLoader


def test_chunk_generator_emits_deterministic_chunk_ids() -> None:
    source = TextSourceLoader().load(Path("tests/fixtures/sample.txt"))
    generator = DeterministicChunkGenerator(max_chunk_chars=80)

    first_run = generator.generate(source)
    second_run = generator.generate(source)

    assert [chunk.chunk_id for chunk in first_run] == [chunk.chunk_id for chunk in second_run]
    assert len(first_run) >= 3


def test_chunk_generator_prefers_paragraph_boundaries() -> None:
    source = _loaded_source(
        "First paragraph stays together.\n\nSecond paragraph also stays together.\n\nThird paragraph."
    )
    generator = DeterministicChunkGenerator(max_chunk_chars=60)

    chunks = generator.generate(source)

    assert [chunk.text for chunk in chunks] == [
        "First paragraph stays together.",
        "Second paragraph also stays together.\n\nThird paragraph.",
    ]


def test_chunk_generator_prefers_sentence_boundaries_within_long_paragraphs() -> None:
    source = _loaded_source(
        "First sentence stays intact. Second sentence also stays intact. Third sentence closes cleanly."
    )
    generator = DeterministicChunkGenerator(max_chunk_chars=55)

    chunks = generator.generate(source)

    assert [chunk.text for chunk in chunks] == [
        "First sentence stays intact.",
        "Second sentence also stays intact.",
        "Third sentence closes cleanly.",
    ]


def test_chunk_generator_falls_back_to_hard_wrap_for_oversized_sentence() -> None:
    source = _loaded_source(
        "This sentence has no punctuation or paragraph break and should still be wrapped safely without dropping any words from the final chunk output"
    )
    generator = DeterministicChunkGenerator(max_chunk_chars=45)

    chunks = generator.generate(source)

    assert len(chunks) == 4
    assert chunks[0].text == "This sentence has no punctuation or paragraph"
    assert chunks[-1].text.endswith("chunk output")
    assert " ".join(chunk.text for chunk in chunks) == source.units[0].text


def test_chunk_generator_merges_cross_page_continuations_before_segmenting() -> None:
    source = LoadedSource(
        metadata=SourceMetadata(
            source_id="test-source",
            source_type="pdf",
            input_path=Path("tests/fixtures/custom.pdf"),
            title="Custom PDF fixture",
            checksum_sha256="sha256",
            byte_size=128,
            page_count=2,
        ),
        units=[
            RawContentUnit(
                unit_id="page-001",
                unit_type="pdf_page",
                text="This sentence continues",
                ordinal=1,
                page_number=1,
            ),
            RawContentUnit(
                unit_id="page-002",
                unit_type="pdf_page",
                text="onto the next page before it ends. A new sentence starts here.",
                ordinal=2,
                page_number=2,
            ),
        ],
        warnings=[],
    )
    generator = DeterministicChunkGenerator(max_chunk_chars=70)

    chunks = generator.generate(source)

    assert [chunk.text for chunk in chunks] == [
        "This sentence continues onto the next page before it ends.",
        "A new sentence starts here.",
    ]
    assert all(chunk.page_number == 1 for chunk in chunks)


def _loaded_source(text: str) -> LoadedSource:
    return LoadedSource(
        metadata=SourceMetadata(
            source_id="test-source",
            source_type="text",
            input_path=Path("tests/fixtures/custom.txt"),
            title="Custom fixture",
            checksum_sha256="sha256",
            byte_size=len(text.encode("utf-8")),
            page_count=None,
        ),
        units=[
            RawContentUnit(
                unit_id="unit-001",
                unit_type="text_block",
                text=text,
                ordinal=1,
                page_number=None,
            )
        ],
        warnings=[],
    )
