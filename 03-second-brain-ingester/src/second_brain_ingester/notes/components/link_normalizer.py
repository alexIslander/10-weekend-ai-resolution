"""Clean related-link values returned by extraction providers."""

from __future__ import annotations

import re


def normalize_links(links: list[str]) -> list[str]:
    cleaned_links: list[str] = []
    seen: set[str] = set()
    for link in links:
        cleaned = normalize_link(link)
        if cleaned is None:
            continue
        link_key = cleaned.casefold()
        if link_key in seen:
            continue
        seen.add(link_key)
        cleaned_links.append(cleaned)
    return cleaned_links


def normalize_link(link: str) -> str | None:
    cleaned = link.strip()
    if not cleaned:
        return None

    wiki_match = re.fullmatch(r"\[\[\s*([^\]]+?)\s*\]\]", cleaned)
    if wiki_match:
        cleaned = wiki_match.group(1).strip()

    markdown_match = re.fullmatch(r"\[\s*([^\]]+?)\s*\]\(\s*([^)]+?)\s*\)", cleaned)
    if markdown_match:
        cleaned = markdown_match.group(1).strip()

    cleaned = cleaned.strip("[]()# \t")
    cleaned = re.sub(r"\s+", " ", cleaned)
    if not cleaned or cleaned.casefold() in _PLACEHOLDER_VALUES:
        return None
    if "[[" in cleaned or "]]" in cleaned:
        return None
    if cleaned.startswith(("http://", "https://")):
        return None
    return cleaned


_PLACEHOLDER_VALUES = {
    "active listening techniques",
    "generic link",
    "none",
    "n/a",
    "na",
    "null",
    "related link",
    "related links",
    "reference",
    "tbd",
    "todo",
}
