"""Deterministic anti-pattern generation for dry-run enrichment."""

from __future__ import annotations

from second_brain_ingester.common.models import AtomicNote


class DeterministicAntiPatternGenerator:
    def enrich(self, notes: list[AtomicNote]) -> list[AtomicNote]:
        anti_pattern_notes = [
            AtomicNote(
                note_id=f"{note.note_id}-anti-pattern",
                title=f"Anti-pattern: {note.title}",
                slug=f"{note.slug}-anti-pattern",
                note_type="anti-pattern",
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
        return [*notes, *anti_pattern_notes]


def _build_body(note: AtomicNote) -> str:
    summary_line = _extract_summary_line(note.body) or note.title
    return (
        "## Failure mode\n\n"
        f"Do not apply {summary_line.lower()} without checking context, "
        "audience, and tradeoffs.\n\n"
        "## Why this breaks down\n\n"
        f"- The original note `[[{note.title}]]` depends on conditions that may not hold.\n"
        "- Blind reuse turns a useful heuristic into a rigid rule.\n"
        "- Missing feedback loops usually show up before the tactic fully fails.\n\n"
        "## Recovery prompt\n\n"
        f"- Re-read `[[{note.title}]]` and restate the intended use in one sentence.\n"
        "- Name one signal that the idea is being over-applied.\n"
        "- Decide what to stop, adjust, or validate before repeating it."
    )


def _extract_summary_line(body: str) -> str:
    for line in body.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or stripped.startswith("-"):
            continue
        return stripped.rstrip(".")
    return ""


def _build_tags(tags: list[str]) -> list[str]:
    merged = ["anti-pattern", *tags]
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
