"""Loader for plain text sources."""

from __future__ import annotations

from pathlib import Path

from second_brain_ingester.common.models import LoadedSource, RawContentUnit, SourceMetadata
from second_brain_ingester.ingest.components.common import (
    compute_checksum,
    make_source_id,
    normalize_whitespace,
)


class TextSourceLoader:
    _supported_suffixes = {".md", ".rst", ".text", ".txt"}

    def can_load(self, path: Path) -> bool:
        return path.suffix.lower() in self._supported_suffixes

    def load(self, path: Path) -> LoadedSource:
        raw_text = normalize_whitespace(path.read_text(encoding="utf-8"))
        checksum = compute_checksum(path)
        source_id = make_source_id(path, checksum)
        paragraphs = [segment.strip() for segment in raw_text.split("\n\n") if segment.strip()]
        units = [
            RawContentUnit(
                unit_id=f"{source_id}-unit-{index:03d}",
                unit_type="text_block",
                text=paragraph,
                ordinal=index,
            )
            for index, paragraph in enumerate(paragraphs, start=1)
        ]
        metadata = SourceMetadata(
            source_id=source_id,
            source_type="text",
            input_path=path,
            title=path.stem.replace("-", " ").title(),
            checksum_sha256=checksum,
            byte_size=path.stat().st_size,
        )
        return LoadedSource(metadata=metadata, units=units)
