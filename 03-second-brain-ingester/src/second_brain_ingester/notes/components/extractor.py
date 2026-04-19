"""Structured note extractor built on top of the client boundary."""

from __future__ import annotations

import re
from pathlib import Path

from second_brain_ingester.common.llm import StructuredExtractionClient
from second_brain_ingester.common.models import (
    AtomicNote,
    ExtractionRequest,
    ProcessedChunk,
    SourceMetadata,
)


class StructuredNoteExtractor:
    def __init__(self, client: StructuredExtractionClient, prompt_text: str) -> None:
        self._client = client
        self._prompt_text = prompt_text

    def extract(
        self,
        chunks: list[ProcessedChunk],
        source_metadata: SourceMetadata,
    ) -> list[AtomicNote]:
        notes: list[AtomicNote] = []
        seen_slugs: set[str] = set()

        for chunk in chunks:
            response = self._client.complete(
                ExtractionRequest(
                    source_id=source_metadata.source_id,
                    source_type=source_metadata.source_type,
                    source_title=source_metadata.title,
                    chunk_id=chunk.chunk_id,
                    chunk_title=chunk.title,
                    chunk_text=chunk.text,
                    prompt=self._prompt_text,
                )
            )
            for index, draft in enumerate(response.notes, start=1):
                slug = _unique_slug(_slugify(draft.title), seen_slugs)
                seen_slugs.add(slug)
                notes.append(
                    AtomicNote(
                        note_id=_build_note_id(source_metadata.source_id, chunk.ordinal, index),
                        title=draft.title,
                        slug=slug,
                        note_type="concept",
                        body=draft.body,
                        source_id=source_metadata.source_id,
                        chunk_ids=[chunk.chunk_id],
                        tags=draft.tags,
                        links=draft.links,
                        source_excerpt=draft.source_excerpt,
                    )
                )

        return notes


def load_extractor_prompt(prompt_path: Path) -> str:
    return prompt_path.read_text(encoding="utf-8").strip()


def _build_note_id(source_id: str, chunk_ordinal: int, note_ordinal: int) -> str:
    return f"{source_id}-note-{chunk_ordinal:03d}-{note_ordinal:02d}"


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "note"


def _unique_slug(base_slug: str, seen_slugs: set[str]) -> str:
    if base_slug not in seen_slugs:
        return base_slug

    suffix = 2
    while f"{base_slug}-{suffix}" in seen_slugs:
        suffix += 1
    return f"{base_slug}-{suffix}"
