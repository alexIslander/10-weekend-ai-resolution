"""Deterministic ADR generation for dry-run enrichment."""

from __future__ import annotations

from second_brain_ingester.common.models import AtomicNote

_DECISION_KEYWORDS = {
    "adopt",
    "architecture",
    "choose",
    "constraint",
    "constraints",
    "decision",
    "decisions",
    "prefer",
    "standardize",
    "trade-off",
    "trade-offs",
    "tradeoff",
    "tradeoffs",
}


class DeterministicAdrGenerator:
    def __init__(self, max_candidates: int = 10) -> None:
        self._max_candidates = max_candidates

    def enrich(self, notes: list[AtomicNote]) -> list[AtomicNote]:
        candidates = [
            note
            for note in notes
            if note.note_type == "concept" and _is_decision_note(note)
        ][: self._max_candidates]
        adr_notes = [
            AtomicNote(
                note_id=f"{note.note_id}-adr",
                title=f"ADR {index:03d}: {note.title}",
                slug=f"{note.slug}-adr",
                note_type="adr",
                body=_build_body(note),
                source_id=note.source_id,
                chunk_ids=list(note.chunk_ids),
                tags=_build_tags(note.tags),
                links=_build_links(note),
                source_excerpt=note.source_excerpt,
            )
            for index, note in enumerate(candidates, start=1)
        ]
        return [*notes, *adr_notes]


def _is_decision_note(note: AtomicNote) -> bool:
    search_text = " ".join([note.title, note.body, *note.tags]).lower()
    return any(keyword in search_text for keyword in _DECISION_KEYWORDS)


def _build_body(note: AtomicNote) -> str:
    summary_line = _extract_summary_line(note.body) or note.title
    return (
        "## Context\n\n"
        f"The source note `[[{note.title}]]` captures a decision-shaped idea: "
        f"{summary_line.lower()}.\n\n"
        "## Options considered\n\n"
        f"- Keep the current approach described in `[[{note.title}]]`.\n"
        "- Delay the decision until more evidence is available.\n"
        "- Choose a narrower variant that reduces risk but also limits upside.\n\n"
        "## Decision\n\n"
        f"Adopt {summary_line.lower()} when the surrounding constraints match the source context.\n\n"
        "## Rationale\n\n"
        f"- The original note `[[{note.title}]]` already frames the tradeoff clearly.\n"
        "- Reusing the decision record preserves why this path was selected.\n"
        "- Writing the rationale down makes future review cheaper.\n\n"
        "## Consequences\n\n"
        "- Positive: later notes can inherit the reasoning instead of re-deriving it.\n"
        "- Negative: the decision can drift out of date if constraints change.\n"
        "- Follow-up: review this ADR when new counterexamples appear.\n\n"
        "## Governance\n\n"
        "- Owner: revisit when adjacent notes or implementations change.\n"
        "- Review trigger: conflicting evidence, new constraints, or repeated exceptions.\n"
        "- Status: proposed from the current source note.\n\n"
        "## Counter-evidence\n\n"
        "- Watch for examples where the same idea fails under different constraints.\n"
        "- If exceptions dominate, demote this ADR back to a plain concept note."
    )


def _extract_summary_line(body: str) -> str:
    for line in body.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or stripped.startswith("-"):
            continue
        return stripped.rstrip(".")
    return ""


def _build_tags(tags: list[str]) -> list[str]:
    merged = ["adr", *tags]
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
