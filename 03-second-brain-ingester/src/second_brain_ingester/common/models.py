"""Typed data models shared across the pipeline."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

from second_brain_ingester.common.types import NoteType, RawUnitType, SourceType


@dataclass(frozen=True)
class ErrorPayload:
    code: str
    message: str
    context: dict[str, str] = field(default_factory=dict)


@dataclass(frozen=True)
class SourceMetadata:
    source_id: str
    source_type: SourceType
    input_path: Path
    title: str
    checksum_sha256: str
    byte_size: int
    page_count: int | None = None


@dataclass(frozen=True)
class RawContentUnit:
    unit_id: str
    unit_type: RawUnitType
    text: str
    ordinal: int
    page_number: int | None = None


@dataclass(frozen=True)
class LoadedSource:
    metadata: SourceMetadata
    units: list[RawContentUnit]
    warnings: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class ProcessedChunk:
    chunk_id: str
    source_id: str
    ordinal: int
    text: str
    title: str
    page_number: int | None = None


@dataclass(frozen=True)
class ExtractedNoteDraft:
    title: str
    summary: str
    body: str
    tags: list[str] = field(default_factory=list)
    links: list[str] = field(default_factory=list)
    source_excerpt: str | None = None


@dataclass(frozen=True)
class ExtractionRequest:
    source_id: str
    source_type: SourceType
    source_title: str
    chunk_id: str
    chunk_title: str
    chunk_text: str
    prompt: str
    dry_run: bool = True


@dataclass(frozen=True)
class ExtractionResponse:
    chunk_id: str
    raw_payload: str
    notes: list[ExtractedNoteDraft]


@dataclass(frozen=True)
class AtomicNote:
    note_id: str
    title: str
    slug: str
    note_type: NoteType
    body: str
    source_id: str
    chunk_ids: list[str]
    tags: list[str] = field(default_factory=list)
    links: list[str] = field(default_factory=list)
    source_excerpt: str | None = None


@dataclass(frozen=True)
class AdrNote:
    note_id: str
    title: str
    summary: str
    source_id: str


@dataclass(frozen=True)
class MocSummary:
    note_id: str
    title: str
    linked_note_ids: list[str]
    source_id: str


@dataclass(frozen=True)
class PipelineResult:
    run_id: str
    output_dir: Path
    manifest_path: Path
    note_paths: list[Path]
