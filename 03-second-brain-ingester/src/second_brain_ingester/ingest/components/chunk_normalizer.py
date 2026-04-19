"""Normalize raw units into deterministic chunk objects."""

from __future__ import annotations

import hashlib
import textwrap

from second_brain_ingester.common.models import LoadedSource, ProcessedChunk
from second_brain_ingester.common.types import RawUnitType


class DeterministicChunkGenerator:
    def __init__(self, max_chunk_chars: int = 900) -> None:
        self._max_chunk_chars = max_chunk_chars

    def generate(self, source: LoadedSource) -> list[ProcessedChunk]:
        chunks: list[ProcessedChunk] = []
        ordinal = 1
        for unit in source.units:
            segments = self._segment_text(unit.text)
            for segment in segments:
                digest = hashlib.sha256(
                    f"{source.metadata.source_id}:{ordinal}:{segment}".encode()
                ).hexdigest()[:10]
                title = self._chunk_title(unit.unit_type, ordinal, unit.page_number)
                chunks.append(
                    ProcessedChunk(
                        chunk_id=f"{source.metadata.source_id}-chunk-{ordinal:03d}-{digest}",
                        source_id=source.metadata.source_id,
                        ordinal=ordinal,
                        text=segment,
                        title=title,
                        page_number=unit.page_number,
                    )
                )
                ordinal += 1
        return chunks

    def _segment_text(self, text: str) -> list[str]:
        if len(text) <= self._max_chunk_chars:
            return [text]
        return textwrap.wrap(
            text,
            width=self._max_chunk_chars,
            break_long_words=False,
            break_on_hyphens=False,
        )

    def _chunk_title(self, unit_type: RawUnitType, ordinal: int, page_number: int | None) -> str:
        if unit_type == "pdf_page" and page_number is not None:
            return f"Page {page_number} chunk {ordinal}"
        return f"Chunk {ordinal}"
