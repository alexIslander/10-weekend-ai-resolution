"""Deterministic MOC generation for dry-run enrichment."""

from __future__ import annotations

from collections import Counter

from second_brain_ingester.common.models import AtomicNote

_EXCLUDED_TAGS = {"adr", "anti-pattern", "moc", "srq"}


class DeterministicMocGenerator:
    def __init__(self, max_featured_notes: int = 5) -> None:
        self._max_featured_notes = max_featured_notes

    def enrich(self, notes: list[AtomicNote]) -> list[AtomicNote]:
        if any(note.note_type == "moc" for note in notes):
            return notes

        concept_notes = [note for note in notes if note.note_type == "concept"]
        if not concept_notes:
            return notes

        source_id = concept_notes[0].source_id
        title = f"MOC: {source_id}"
        moc_note = AtomicNote(
            note_id=f"{source_id}-moc",
            title=title,
            slug=f"{source_id}-moc",
            note_type="moc",
            body=_build_body(notes, concept_notes, self._max_featured_notes),
            source_id=source_id,
            chunk_ids=_collect_chunk_ids(notes),
            tags=["moc", "map-of-content"],
            links=_collect_links(notes),
            source_excerpt="Deterministic MOC built from the current note inventory.",
        )
        return [*notes, moc_note]


def _build_body(
    notes: list[AtomicNote], concept_notes: list[AtomicNote], max_featured_notes: int
) -> str:
    featured_notes = _rank_notes(concept_notes)[:max_featured_notes]
    supporting_note = (
        featured_notes[1] if len(featured_notes) > 1 else featured_notes[0]
    )
    contrast_note = featured_notes[-1]
    themes = _group_notes_by_theme(concept_notes)
    adr_notes = [note for note in notes if note.note_type == "adr"]
    anti_pattern_notes = [note for note in notes if note.note_type == "anti-pattern"]

    featured_list = "\n".join(
        f"- [[{note.title}]]: {_summary_line(note)}" for note in featured_notes
    )
    reading_order = "\n".join(
        f"{index}. [[{note.title}]]"
        for index, note in enumerate(_rank_notes(concept_notes), start=1)
    )
    theme_sections = "\n\n".join(
        _render_theme_section(theme, grouped_notes)
        for theme, grouped_notes in themes
    )
    adr_section = _render_note_list(
        adr_notes,
        empty_message="- No ADR notes were generated in this run.",
    )
    anti_pattern_section = _render_note_list(
        anti_pattern_notes,
        empty_message="- No anti-pattern notes were generated in this run.",
    )

    return (
        "## Start here\n\n"
        "### Newcomer\n\n"
        f"- Begin with [[{featured_notes[0].title}]] to anchor the core idea.\n"
        f"- Follow with [[{supporting_note.title}]] to add supporting detail.\n\n"
        "### Reviewer\n\n"
        f"- Scan the featured note set, then jump to [[{contrast_note.title}]] "
        "for an edge-case or contrast note.\n"
        "- Use the theme groups below to spot missing or duplicated coverage.\n\n"
        "### Team lead\n\n"
        f"- Start with [[{featured_notes[0].title}]] and [[{contrast_note.title}]] "
        "for onboarding context.\n"
        "- Use the ADR and anti-pattern sections to turn ideas into review prompts.\n\n"
        "## Featured notes\n\n"
        f"{featured_list}\n\n"
        "## Suggested reading order\n\n"
        f"{reading_order}\n\n"
        "## Themes\n\n"
        f"{theme_sections}\n\n"
        "## ADR notes\n\n"
        f"{adr_section}\n\n"
        "## Anti-pattern notes\n\n"
        f"{anti_pattern_section}\n\n"
        "## Vault map\n\n"
        "```mermaid\n"
        "mindmap\n"
        f"{_render_mindmap(themes)}\n"
        "```"
    )


def _rank_notes(notes: list[AtomicNote]) -> list[AtomicNote]:
    return sorted(
        notes,
        key=lambda note: (
            -len(note.links),
            -len(note.tags),
            note.title.lower(),
        ),
    )


def _group_notes_by_theme(notes: list[AtomicNote]) -> list[tuple[str, list[AtomicNote]]]:
    theme_buckets: dict[str, list[AtomicNote]] = {}
    fallback_theme = "general"

    for note in _rank_notes(notes):
        theme = _primary_theme(note)
        theme_buckets.setdefault(theme, []).append(note)

    ranked_themes = sorted(
        theme_buckets.items(),
        key=lambda item: (-len(item[1]), item[0]),
    )
    if not ranked_themes:
        return [(fallback_theme, [])]
    return ranked_themes


def _primary_theme(note: AtomicNote) -> str:
    filtered_tags = [tag for tag in note.tags if tag not in _EXCLUDED_TAGS]
    if filtered_tags:
        counts = Counter(filtered_tags)
        return sorted(counts.items(), key=lambda item: (-item[1], item[0]))[0][0]
    return "general"


def _render_theme_section(theme: str, notes: list[AtomicNote]) -> str:
    note_lines = "\n".join(f"- [[{note.title}]]: {_summary_line(note)}" for note in notes)
    return f"### {theme.title()}\n\n{note_lines}"


def _render_note_list(notes: list[AtomicNote], empty_message: str) -> str:
    if not notes:
        return empty_message
    return "\n".join(f"- [[{note.title}]]" for note in notes)


def _summary_line(note: AtomicNote) -> str:
    for line in note.body.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or stripped.startswith("-"):
            continue
        return stripped.rstrip(".")
    return note.title


def _render_mindmap(themes: list[tuple[str, list[AtomicNote]]]) -> str:
    lines = ["  root((Map of Content))"]
    for theme, notes in themes:
        lines.append(f"    {theme.title()}")
        for note in notes:
            lines.append(f"      {note.title}")
    return "\n".join(lines)


def _collect_chunk_ids(notes: list[AtomicNote]) -> list[str]:
    chunk_ids: list[str] = []
    for note in notes:
        for chunk_id in note.chunk_ids:
            if chunk_id not in chunk_ids:
                chunk_ids.append(chunk_id)
    return chunk_ids


def _collect_links(notes: list[AtomicNote]) -> list[str]:
    ordered_links: list[str] = []
    for note in notes:
        if note.note_type == "moc":
            continue
        if note.title not in ordered_links:
            ordered_links.append(note.title)
    return ordered_links
