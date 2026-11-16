"""Shared type aliases."""

from __future__ import annotations

from typing import Literal

SourceType = Literal["text", "pdf"]
RawUnitType = Literal["text_block", "pdf_page"]
NoteType = Literal["concept", "srq", "anti-pattern", "adr", "moc"]
