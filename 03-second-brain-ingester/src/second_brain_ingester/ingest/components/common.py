"""Helpers shared by ingest components."""

from __future__ import annotations

import hashlib
import re
from pathlib import Path


def compute_checksum(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def make_source_id(path: Path, checksum: str) -> str:
    return f"{path.stem.lower().replace(' ', '-')}-{checksum[:10]}"


def normalize_whitespace(value: str) -> str:
    compact = value.replace("\r\n", "\n").replace("\r", "\n")
    compact = re.sub(r"[ \t]+", " ", compact)
    compact = re.sub(r"\n{3,}", "\n\n", compact)
    return compact.strip()
