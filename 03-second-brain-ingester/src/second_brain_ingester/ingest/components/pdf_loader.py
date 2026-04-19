"""Deterministic loader for simple text-based PDF fixtures."""

from __future__ import annotations

import re
from pathlib import Path

from second_brain_ingester.common.models import LoadedSource, RawContentUnit, SourceMetadata
from second_brain_ingester.ingest.components.common import (
    compute_checksum,
    make_source_id,
    normalize_whitespace,
)

_STREAM_PATTERN = re.compile(rb"stream\s*(.*?)\s*endstream", re.DOTALL)
_TEXT_PATTERN = re.compile(rb"\((.*?)\)\s*Tj", re.DOTALL)


def _decode_pdf_text(raw_value: bytes) -> str:
    text = raw_value.replace(rb"\(", b"(").replace(rb"\)", b")").replace(rb"\\", b"\\")
    return text.decode("latin-1")


class PdfSourceLoader:
    def can_load(self, path: Path) -> bool:
        return path.suffix.lower() == ".pdf"

    def load(self, path: Path) -> LoadedSource:
        payload = path.read_bytes()
        checksum = compute_checksum(path)
        source_id = make_source_id(path, checksum)
        streams = _STREAM_PATTERN.findall(payload)
        units: list[RawContentUnit] = []
        warnings: list[str] = []

        for index, stream in enumerate(streams, start=1):
            text_fragments = [_decode_pdf_text(match) for match in _TEXT_PATTERN.findall(stream)]
            joined_text = " ".join(fragment for fragment in text_fragments if fragment)
            page_text = normalize_whitespace(joined_text)
            if not page_text:
                continue
            units.append(
                RawContentUnit(
                    unit_id=f"{source_id}-page-{index:03d}",
                    unit_type="pdf_page",
                    text=page_text,
                    ordinal=index,
                    page_number=index,
                )
            )

        if not units:
            raise ValueError(f"Unable to extract text from PDF: {path}")

        warnings.append(
            "PDF extraction currently supports text-based stream content; "
            "image-only PDFs are not yet handled."
        )
        metadata = SourceMetadata(
            source_id=source_id,
            source_type="pdf",
            input_path=path,
            title=path.stem.replace("-", " ").title(),
            checksum_sha256=checksum,
            byte_size=path.stat().st_size,
            page_count=len(units),
        )
        return LoadedSource(metadata=metadata, units=units, warnings=warnings)
