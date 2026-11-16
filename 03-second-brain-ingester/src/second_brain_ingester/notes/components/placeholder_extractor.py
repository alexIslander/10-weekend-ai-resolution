"""Deterministic placeholder note extraction for local ingest flows."""

from __future__ import annotations

import re

from second_brain_ingester.common.models import AtomicNote, ProcessedChunk, SourceMetadata


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "note"


class PlaceholderNoteExtractor:
    def extract(
        self,
        chunks: list[ProcessedChunk],
        source_metadata: SourceMetadata,
    ) -> list[AtomicNote]:
        notes: list[AtomicNote] = []
        for chunk in chunks:
            title = f"{source_metadata.title} note {chunk.ordinal}"
            slug = _slugify(title)
            body = (
                "## Summary\n\n"
                "This placeholder note was generated from deterministic local ingest.\n\n"
                "## Source excerpt\n\n"
                f"{chunk.text}\n"
            )
            notes.append(
                AtomicNote(
                    note_id=f"{source_metadata.source_id}-note-{chunk.ordinal:03d}",
                    title=title,
                    slug=slug,
                    note_type="concept",
                    body=body,
                    source_id=source_metadata.source_id,
                    chunk_ids=[chunk.chunk_id],
                    tags=["local-ingest", source_metadata.source_type],
                )
            )
        return notes
