"""Normalize extracted note drafts before atomic notes are materialized."""

from __future__ import annotations

import re
from dataclasses import dataclass

from second_brain_ingester.common.models import ExtractedNoteDraft, ProcessedChunk
from second_brain_ingester.notes.components.link_normalizer import normalize_links
from second_brain_ingester.notes.components.note_body_normalizer import normalize_note_body


@dataclass(frozen=True)
class NormalizedNoteDraft:
    title: str
    slug: str
    body: str
    links: list[str]


class DeduplicatingDraftNormalizer:
    """Normalize draft shape and suppress duplicate concepts within one run."""

    def __init__(self) -> None:
        self._seen_slugs: set[str] = set()
        self._seen_fingerprints: set[str] = set()

    def normalize(
        self,
        draft: ExtractedNoteDraft,
        chunk_title: str,
    ) -> NormalizedNoteDraft | None:
        title = normalize_title(draft.title, draft.summary, chunk_title)
        base_slug = slugify(title)
        fingerprint = note_fingerprint(title=title, summary=draft.summary)
        if base_slug in self._seen_slugs or fingerprint in self._seen_fingerprints:
            return None

        links = normalize_links(draft.links)
        body = normalize_note_body(
            summary=draft.summary,
            body=draft.body,
            links=links,
            source_excerpt=draft.source_excerpt,
        )
        slug = unique_slug(base_slug, self._seen_slugs)
        self._seen_slugs.add(slug)
        self._seen_fingerprints.add(fingerprint)
        return NormalizedNoteDraft(title=title, slug=slug, body=body, links=links)


def progress_chunk_title(chunk: ProcessedChunk) -> str:
    if chunk.page_number is not None:
        return f"Page {chunk.page_number} chunk {chunk.ordinal}"
    return f"Chunk {chunk.ordinal}"


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "note"


def unique_slug(base_slug: str, seen_slugs: set[str]) -> str:
    if base_slug not in seen_slugs:
        return base_slug

    suffix = 2
    while f"{base_slug}-{suffix}" in seen_slugs:
        suffix += 1
    return f"{base_slug}-{suffix}"


def normalize_title(title: str, summary: str, chunk_title: str) -> str:
    cleaned_title = fix_merged_title_words(" ".join(title.split()).strip())
    if cleaned_title and not is_generic_title(cleaned_title, chunk_title):
        return cleaned_title
    return title_from_summary(summary) or cleaned_title or chunk_title


def fix_merged_title_words(title: str) -> str:
    replacements = {
        "neuralcoupling": "Neural Coupling",
    }
    normalized = title
    for merged_word, replacement in replacements.items():
        normalized = re.sub(
            rf"\b{re.escape(merged_word)}\b",
            replacement,
            normalized,
            flags=re.IGNORECASE,
        )
    return normalized


def is_generic_title(title: str, chunk_title: str) -> bool:
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


def title_from_summary(summary: str) -> str:
    cleaned_summary = re.sub(r"\s+", " ", summary).strip()
    if not cleaned_summary:
        return ""
    first_clause = re.split(r"[.!?;:]", cleaned_summary, maxsplit=1)[0].strip()
    words = [word for word in re.findall(r"[A-Za-z0-9']+", first_clause)[:10] if word]
    if not words:
        return ""
    candidate = " ".join(words)
    return candidate[0].upper() + candidate[1:]


def note_fingerprint(*, title: str, summary: str) -> str:
    summary_terms = re.findall(r"[a-z0-9]+", summary.casefold())[:16]
    return f"{slugify(title)}|{'-'.join(summary_terms)}"

