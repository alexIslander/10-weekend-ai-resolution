from __future__ import annotations

from pathlib import Path

from second_brain_ingester.ingest.components.text_loader import TextSourceLoader


def test_text_loader_captures_metadata_and_units() -> None:
    loader = TextSourceLoader()

    source = loader.load(Path("tests/fixtures/sample.txt"))

    assert source.metadata.source_type == "text"
    assert len(source.units) == 3
    assert source.units[0].text == "Architecture trade-offs only make sense in context."
