"""Deterministic SRQ generation for dry-run enrichment."""

from __future__ import annotations

from second_brain_ingester.common.models import AtomicNote


class DeterministicSrqGenerator:
    def enrich(self, notes: list[AtomicNote]) -> list[AtomicNote]:
        srq_notes = [
            AtomicNote(
                note_id=f"{note.note_id}-srq",
                title=f"SRQ: {note.title}",
                slug=f"{note.slug}-srq",
                note_type="srq",
                body=_build_body(note),
                source_id=note.source_id,
                chunk_ids=list(note.chunk_ids),
                tags=_build_tags(note.tags),
                links=_build_links(note),
                source_excerpt=note.source_excerpt,
            )
            for note in notes
            if note.note_type == "concept"
        ]
        return [*notes, *srq_notes]


def _build_body(note: AtomicNote) -> str:
    summary_line = _extract_summary_line(note.body) or note.title
    return (
        "## Question\n\n"
        f"How should I apply {summary_line.lower()}?\n\n"
        "## Answer pattern\n\n"
        f"- Re-read `[[{note.title}]]` before using this prompt.\n"
        f"- Explain the core idea from `{note.title}` in one sentence.\n"
        "- Name one concrete situation where it changes a decision.\n"
        "- Name one tradeoff or failure mode to watch for.\n\n"
        "## Review cue\n\n"
        f"Use this SRQ after capturing or revising notes linked to `[[{note.title}]]`."
    )


def _extract_summary_line(body: str) -> str:
    for line in body.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or stripped.startswith("-"):
            continue
        return stripped.rstrip(".")
    return ""


def _build_tags(tags: list[str]) -> list[str]:
    merged = ["srq", *tags]
    seen: set[str] = set()
    ordered: list[str] = []
    for tag in merged:
        if tag not in seen:
            seen.add(tag)
            ordered.append(tag)
    return ordered


def _build_links(note: AtomicNote) -> list[str]:
    merged = [note.title, *note.links]
    seen: set[str] = set()
    ordered: list[str] = []
    for link in merged:
        if link not in seen:
            seen.add(link)
            ordered.append(link)
    return ordered
