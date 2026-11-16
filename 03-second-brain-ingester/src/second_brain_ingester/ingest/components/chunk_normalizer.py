"""Normalize raw units into deterministic chunk objects."""

from __future__ import annotations

import hashlib
import re
import textwrap
from dataclasses import dataclass

from second_brain_ingester.common.models import LoadedSource, ProcessedChunk, RawContentUnit
from second_brain_ingester.common.types import RawUnitType


_PARAGRAPH_BREAK_RE = re.compile(r"\n\s*\n+")
_SENTENCE_BREAK_RE = re.compile(r"(?<=[.!?])\s+(?=[\"'(\[]?[A-Z0-9])")
_SENTENCE_ENDINGS = (".", "!", "?", '"', "”", "’")


@dataclass(frozen=True)
class _ChunkableUnit:
    text: str
    unit_type: RawUnitType
    page_number: int | None


class DeterministicChunkGenerator:
    def __init__(self, max_chunk_chars: int = 900) -> None:
        self._max_chunk_chars = max_chunk_chars

    def generate(self, source: LoadedSource) -> list[ProcessedChunk]:
        chunks: list[ProcessedChunk] = []
        ordinal = 1
        for unit in self._merge_continuation_units(source.units):
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

    def _merge_continuation_units(self, units: list[RawContentUnit]) -> list[_ChunkableUnit]:
        merged_units: list[_ChunkableUnit] = []
        for unit in units:
            text = unit.text.strip()
            if not text:
                continue

            if not merged_units:
                merged_units.append(
                    _ChunkableUnit(
                        text=text,
                        unit_type=unit.unit_type,
                        page_number=unit.page_number,
                    )
                )
                continue

            previous = merged_units[-1]
            if self._should_merge_units(previous.text, text):
                merged_units[-1] = _ChunkableUnit(
                    text=f"{previous.text} {text}",
                    unit_type=previous.unit_type,
                    page_number=previous.page_number,
                )
                continue

            merged_units.append(
                _ChunkableUnit(
                    text=text,
                    unit_type=unit.unit_type,
                    page_number=unit.page_number,
                )
            )
        return merged_units

    def _segment_text(self, text: str) -> list[str]:
        if len(text) <= self._max_chunk_chars:
            return [text]

        paragraphs = self._split_paragraphs(text)
        chunks: list[str] = []
        current_parts: list[str] = []
        current_length = 0

        for paragraph in paragraphs:
            if len(paragraph) > self._max_chunk_chars:
                if current_parts:
                    chunks.append("\n\n".join(current_parts))
                    current_parts = []
                    current_length = 0
                chunks.extend(self._segment_paragraph(paragraph))
                continue

            separator_length = 2 if current_parts else 0
            projected_length = current_length + separator_length + len(paragraph)
            if projected_length <= self._max_chunk_chars:
                current_parts.append(paragraph)
                current_length = projected_length
                continue

            if current_parts:
                chunks.append("\n\n".join(current_parts))
            current_parts = [paragraph]
            current_length = len(paragraph)

        if current_parts:
            chunks.append("\n\n".join(current_parts))
        return chunks

    def _split_paragraphs(self, text: str) -> list[str]:
        paragraphs = [paragraph.strip() for paragraph in _PARAGRAPH_BREAK_RE.split(text) if paragraph.strip()]
        if paragraphs:
            return paragraphs
        stripped = text.strip()
        return [stripped] if stripped else []

    def _segment_paragraph(self, paragraph: str) -> list[str]:
        if len(paragraph) <= self._max_chunk_chars:
            return [paragraph]

        sentences = self._split_sentences(paragraph)
        if len(sentences) == 1:
            return self._hard_wrap(paragraph)

        chunks: list[str] = []
        current_parts: list[str] = []
        current_length = 0

        for sentence in sentences:
            if len(sentence) > self._max_chunk_chars:
                if current_parts:
                    chunks.append(" ".join(current_parts))
                    current_parts = []
                    current_length = 0
                chunks.extend(self._hard_wrap(sentence))
                continue

            separator_length = 1 if current_parts else 0
            projected_length = current_length + separator_length + len(sentence)
            if projected_length <= self._max_chunk_chars:
                current_parts.append(sentence)
                current_length = projected_length
                continue

            if current_parts:
                chunks.append(" ".join(current_parts))
            current_parts = [sentence]
            current_length = len(sentence)

        if current_parts:
            chunks.append(" ".join(current_parts))
        return chunks

    def _split_sentences(self, paragraph: str) -> list[str]:
        sentences = [sentence.strip() for sentence in _SENTENCE_BREAK_RE.split(paragraph) if sentence.strip()]
        return sentences or [paragraph.strip()]

    def _hard_wrap(self, text: str) -> list[str]:
        return textwrap.wrap(
            text,
            width=self._max_chunk_chars,
            break_long_words=False,
            break_on_hyphens=False,
        )

    def _should_merge_units(self, previous_text: str, current_text: str) -> bool:
        previous_tail = previous_text.rstrip()
        current_head = current_text.lstrip()
        if not previous_tail or not current_head:
            return False

        if current_head[0].islower():
            return True
        return not previous_tail.endswith(_SENTENCE_ENDINGS)

    def _chunk_title(self, unit_type: RawUnitType, ordinal: int, page_number: int | None) -> str:
        if unit_type == "pdf_page" and page_number is not None:
            return f"Page {page_number} chunk {ordinal}"
        return f"Chunk {ordinal}"
