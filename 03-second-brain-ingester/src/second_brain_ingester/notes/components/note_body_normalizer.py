"""Render extracted draft bodies into one stable atomic-note shape."""

from __future__ import annotations

import re


def normalize_note_body(
    *,
    summary: str,
    body: str,
    links: list[str],
    source_excerpt: str | None,
) -> str:
    normalized_body = normalize_known_headings(body.strip())
    key_details_source = extract_section(normalized_body, "Key details")
    key_details = normalize_key_details(
        key_details_source or remove_known_sections(normalized_body),
        fallback_summary=summary,
    )
    related_links = "\n".join(f"- [[{link}]]" for link in links) if links else "- None"
    excerpt = (
        source_excerpt.strip()
        if source_excerpt and source_excerpt.strip()
        else summary.strip()
    )
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


def normalize_known_headings(body: str) -> str:
    heading_names = {
        "summary": "Summary",
        "key details": "Key details",
        "related links": "Related links",
        "source excerpt": "Source excerpt",
    }

    def replace_heading(match: re.Match[str]) -> str:
        heading = " ".join(match.group(1).casefold().split())
        return f"## {heading_names[heading]}"

    return re.sub(
        r"^#{1,6}\s+(summary|key\s+details|related\s+links|source\s+excerpt)\s*$",
        replace_heading,
        body,
        flags=re.IGNORECASE | re.MULTILINE,
    )


def extract_section(body: str, heading: str) -> str:
    match = re.search(
        rf"^## {re.escape(heading)}\s*\n(?P<section>.*?)(?=^## |\Z)",
        body,
        flags=re.MULTILINE | re.DOTALL,
    )
    return match.group("section").strip() if match else ""


def remove_known_sections(body: str) -> str:
    return re.sub(
        r"^## (Summary|Key details|Related links|Source excerpt)\s*\n.*?(?=^## |\Z)",
        "",
        body,
        flags=re.MULTILINE | re.DOTALL,
    ).strip()


def normalize_key_details(body: str, fallback_summary: str) -> str:
    stripped = body.strip()
    if not stripped:
        return f"- {fallback_summary.strip()}"
    if stripped.startswith("- ") or "\n- " in stripped:
        return stripped

    paragraphs = [
        paragraph.strip()
        for paragraph in re.split(r"\n\s*\n", stripped)
        if paragraph.strip()
    ]
    bullet_lines = [f"- {paragraph}" for paragraph in paragraphs[:3]]
    if bullet_lines:
        return "\n".join(bullet_lines)
    return f"- {fallback_summary.strip()}"
