"""Typed pipeline run state."""

from __future__ import annotations

import hashlib
from dataclasses import dataclass, field
from pathlib import Path

from second_brain_ingester.common.models import (
    AdrNote,
    AtomicNote,
    ErrorPayload,
    MocSummary,
    PipelineResult,
    ProcessedChunk,
    SourceMetadata,
)


@dataclass
class PipelineState:
    source_metadata: SourceMetadata
    chunks: list[ProcessedChunk] = field(default_factory=list)
    notes: list[AtomicNote] = field(default_factory=list)
    adrs: list[AdrNote] = field(default_factory=list)
    moc: MocSummary | None = None
    warnings: list[str] = field(default_factory=list)
    errors: list[ErrorPayload] = field(default_factory=list)
    output: PipelineResult | None = None

    @property
    def run_id(self) -> str:
        digest = hashlib.sha256(
            self.source_metadata.checksum_sha256.encode("utf-8")
        ).hexdigest()[:8]
        return f"{self.source_metadata.input_path.stem.lower().replace(' ', '-')}-{digest}"

    @property
    def has_errors(self) -> bool:
        return bool(self.errors)


def validate_output_directory(path: Path) -> None:
    if path.exists() and not path.is_dir():
        raise ValueError(f"Output path is not a directory: {path}")
