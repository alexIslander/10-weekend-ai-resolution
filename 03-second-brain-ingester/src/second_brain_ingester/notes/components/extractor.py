"""Structured note extractor built on top of the client boundary."""

from __future__ import annotations

import re
from collections.abc import Callable
from pathlib import Path

from second_brain_ingester.common.llm import StructuredExtractionClient
from second_brain_ingester.common.models import (
    AtomicNote,
    ExtractionRequest,
    ProcessedChunk,
    SourceMetadata,
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
        seen_slugs: set[str] = set()
        total_chunks = len(chunks)

        for chunk_index, chunk in enumerate(chunks, start=1):
            self._emit_progress(
                f"Extracting chunk {chunk_index}/{total_chunks}: {chunk.title}"
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
                title = _normalize_title(draft.title, draft.summary, chunk.title)
                body = _normalize_note_body(
                    summary=draft.summary,
                    body=draft.body,
                    links=draft.links,
                    source_excerpt=draft.source_excerpt,
                )
                slug = _unique_slug(_slugify(title), seen_slugs)
                seen_slugs.add(slug)
                notes.append(
                    AtomicNote(
                        note_id=_build_note_id(source_metadata.source_id, chunk.ordinal, index),
                        title=title,
                        slug=slug,
                        note_type="concept",
                        body=body,
                        source_id=source_metadata.source_id,
                        chunk_ids=[chunk.chunk_id],
                        tags=draft.tags,
                        links=draft.links,
                        source_excerpt=draft.source_excerpt,
                    )
                )
            self._emit_progress(
                f"Completed chunk {chunk_index}/{total_chunks}: {chunk.title}"
            )

        return notes

    def _emit_progress(self, message: str) -> None:
        if self._progress_callback is not None:
            self._progress_callback(message)


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


def _normalize_title(title: str, summary: str, chunk_title: str) -> str:
    cleaned_title = " ".join(title.split()).strip()
    if cleaned_title and not _is_generic_title(cleaned_title, chunk_title):
        return cleaned_title
    return _title_from_summary(summary) or cleaned_title or chunk_title


def _is_generic_title(title: str, chunk_title: str) -> bool:
    normalized = title.casefold()
    generic_patterns = (
        r"chunk\s+\d+",
        r"page\s+\d+\s+chunk\s+\d+",
        r"section\s+\d+",
        r"part\s+\d+",
    )
    if any(re.fullmatch(pattern, normalized) for pattern in generic_patterns):
        return True
    return normalized == chunk_title.casefold() and any(
        re.fullmatch(pattern, normalized) for pattern in generic_patterns
    )


def _title_from_summary(summary: str) -> str:
    cleaned_summary = re.sub(r"\s+", " ", summary).strip()
    if not cleaned_summary:
        return ""
    first_clause = re.split(r"[.!?;:]", cleaned_summary, maxsplit=1)[0].strip()
    words = [word for word in re.findall(r"[A-Za-z0-9']+", first_clause)[:10] if word]
    if not words:
        return ""
    candidate = " ".join(words)
    return candidate[0].upper() + candidate[1:]


def _normalize_note_body(
    *,
    summary: str,
    body: str,
    links: list[str],
    source_excerpt: str | None,
) -> str:
    cleaned_body = body.strip()
    required_sections = ("## Summary", "## Key details", "## Related links", "## Source excerpt")
    if all(section in cleaned_body for section in required_sections):
        return cleaned_body

    key_details = _normalize_key_details(cleaned_body, fallback_summary=summary)
    related_links = "\n".join(f"- [[{link}]]" for link in links) if links else "- None"
    excerpt = source_excerpt.strip() if source_excerpt and source_excerpt.strip() else summary.strip()
    return (
        "## Summary\n\n"
        f"{summary.strip()}\n\n"
        "## Key details\n\n"
        f"{key_details}\n\n"
        "## Related links\n\n"
        f"{related_links}\n\n"
        "## Source excerpt\n\n"
        f"{excerpt}"
    ).strip()


def _normalize_key_details(body: str, fallback_summary: str) -> str:
    stripped = body.strip()
    if not stripped:
        return f"- {fallback_summary.strip()}"
    if stripped.startswith("- ") or "\n- " in stripped:
        return stripped

    paragraphs = [paragraph.strip() for paragraph in re.split(r"\n\s*\n", stripped) if paragraph.strip()]
    bullet_lines = [f"- {paragraph}" for paragraph in paragraphs[:3]]
    if bullet_lines:
        return "\n".join(bullet_lines)
    return f"- {fallback_summary.strip()}"
