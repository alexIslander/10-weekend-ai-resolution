"""Deterministic note linker for dry-run enrichment."""

from __future__ import annotations

import re
from dataclasses import replace

from second_brain_ingester.common.models import AtomicNote

_STOP_WORDS = {
    "about",
    "after",
    "again",
    "brain",
    "into",
    "keep",
    "note",
    "notes",
    "only",
    "same",
    "should",
    "source",
    "that",
    "their",
    "them",
    "these",
    "this",
    "through",
    "what",
    "with",
}


class DeterministicNoteLinker:
    def __init__(self, max_links_per_note: int = 3) -> None:
        self._max_links_per_note = max_links_per_note

    def enrich(self, notes: list[AtomicNote]) -> list[AtomicNote]:
        if len(notes) < 2:
            return notes

        keyword_index = {note.note_id: _keywords_for_note(note) for note in notes}
        enriched: list[AtomicNote] = []

        for note in notes:
            candidates = self._rank_candidates(note, notes, keyword_index)
            linked_titles = [candidate.title for candidate in candidates]
            links = _merge_links(note.links, linked_titles)
            body = _append_link_section(note.body, linked_titles)
            enriched.append(replace(note, links=links, body=body))

        return enriched

    def _rank_candidates(
        self,
        note: AtomicNote,
        notes: list[AtomicNote],
        keyword_index: dict[str, set[str]],
    ) -> list[AtomicNote]:
        current_keywords = keyword_index[note.note_id]
        ranked: list[tuple[int, str, AtomicNote]] = []

        for candidate in notes:
            if candidate.note_id == note.note_id:
                continue
            overlap = current_keywords & keyword_index[candidate.note_id]
            if not overlap:
                continue
            ranked.append((-len(overlap), candidate.slug, candidate))

        ranked.sort()
        return [candidate for _, _, candidate in ranked[: self._max_links_per_note]]


def _keywords_for_note(note: AtomicNote) -> set[str]:
    title_seed = note.title.split(":", maxsplit=1)[-1]
    text = " ".join([title_seed, *note.tags])
    return {
        token
        for token in re.findall(r"[a-z0-9]+", text.lower())
        if len(token) >= 4 and token not in _STOP_WORDS
    }


def _merge_links(existing_links: list[str], linked_titles: list[str]) -> list[str]:
    merged = list(existing_links)
    for title in linked_titles:
        if title not in merged:
            merged.append(title)
    return merged


def _append_link_section(body: str, linked_titles: list[str]) -> str:
    if not linked_titles:
        return body

    link_lines = "\n".join(f"- [[{title}]]" for title in linked_titles)
    return f"{body}\n\n## Linked notes\n\n{link_lines}"
