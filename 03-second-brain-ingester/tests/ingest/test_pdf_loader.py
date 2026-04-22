from __future__ import annotations

from pathlib import Path

from second_brain_ingester.ingest.components.pdf_loader import PdfSourceLoader


def test_pdf_loader_extracts_text_streams() -> None:
    loader = PdfSourceLoader()

    source = loader.load(Path("tests/fixtures/sample.pdf"))

    assert source.metadata.source_type == "pdf"
    assert source.metadata.page_count == 1
    assert "Deterministic PDF fixture" in source.units[0].text


def test_pdf_loader_extracts_readable_text_from_narrative_fixture() -> None:
    loader = PdfSourceLoader()

    source = loader.load(Path("tests/fixtures/test-anyone-ch1/HOW-TO-TALK-TO-Anyone-ch1.pdf"))

    combined_text = " ".join(unit.text for unit in source.units)
    assert "Chapter 1" in combined_text
    assert "effective storytelling" in combined_text
    assert "neural coupling" in combined_text


def test_pdf_loader_hardens_technical_fixture_and_emits_parser_warnings() -> None:
    loader = PdfSourceLoader()

    source = loader.load(
        Path("tests/fixtures/test-head-first-sa-ch2/Head-First-Software-Architecture-ch2.pdf")
    )

    combined_text = " ".join(unit.text for unit in source.units)

    assert 'Users can add new content on Lafter as a “Joke”' in combined_text
    assert "they’ve got the logo figured out" in combined_text
    assert r"\222" not in combined_text
    assert r"\223" not in combined_text
    assert any("control glyphs stripped during extraction" in warning for warning in source.warnings)
