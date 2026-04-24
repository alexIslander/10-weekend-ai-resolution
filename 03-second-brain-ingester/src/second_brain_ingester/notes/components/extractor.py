"""Structured note extractor built on top of the client boundary."""

from __future__ import annotations

from collections.abc import Callable
from pathlib import Path

from second_brain_ingester.common.llm import StructuredExtractionClient
from second_brain_ingester.common.models import (
    AtomicNote,
    ExtractionRequest,
    ProcessedChunk,
    SourceMetadata,
)
from second_brain_ingester.notes.components.extraction_normalizer import (
    DeduplicatingDraftNormalizer,
    progress_chunk_title,
)


class StructuredNoteExtractor:
    def __init__(
        self,
        client: StructuredExtractionClient,
        prompt_text: str,
        progress_callback: Callable[[str], None] | None = None,
    ) -> None:
        self._client = client
        self._prompt_text = prompt_text
        self._progress_callback = progress_callback

    def extract(
        self,
        chunks: list[ProcessedChunk],
        source_metadata: SourceMetadata,
    ) -> list[AtomicNote]:
        notes: list[AtomicNote] = []
        normalizer = DeduplicatingDraftNormalizer()
        total_chunks = len(chunks)

        for chunk_index, chunk in enumerate(chunks, start=1):
            progress_title = progress_chunk_title(chunk)
            self._emit_progress(
                f"Extracting chunk {chunk_index}/{total_chunks}: {progress_title}"
            )
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
                normalized = normalizer.normalize(draft, chunk_title=chunk.title)
                if normalized is None:
                    continue

                notes.append(
                    AtomicNote(
                        note_id=_build_note_id(source_metadata.source_id, chunk.ordinal, index),
                        title=normalized.title,
                        slug=normalized.slug,
                        note_type="concept",
                        body=normalized.body,
                        source_id=source_metadata.source_id,
                        chunk_ids=[chunk.chunk_id],
                        tags=draft.tags,
                        links=normalized.links,
                        source_excerpt=draft.source_excerpt,
                    )
                )
            self._emit_progress(
                f"Completed chunk {chunk_index}/{total_chunks}: {progress_title}"
            )

        return notes

    def _emit_progress(self, message: str) -> None:
        if self._progress_callback is not None:
            self._progress_callback(message)


def load_extractor_prompt(prompt_path: Path) -> str:
    return prompt_path.read_text(encoding="utf-8").strip()


def _build_note_id(source_id: str, chunk_ordinal: int, note_ordinal: int) -> str:
    return f"{source_id}-note-{chunk_ordinal:03d}-{note_ordinal:02d}"
