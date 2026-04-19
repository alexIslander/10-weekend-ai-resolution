from __future__ import annotations

from pathlib import Path

from second_brain_ingester.ingest.components.pdf_loader import PdfSourceLoader


def test_pdf_loader_extracts_text_streams() -> None:
    loader = PdfSourceLoader()

    source = loader.load(Path("tests/fixtures/sample.pdf"))

    assert source.metadata.source_type == "pdf"
    assert source.metadata.page_count == 1
    assert "Deterministic PDF fixture" in source.units[0].text
