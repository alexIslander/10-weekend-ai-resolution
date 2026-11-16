"""Protocols for pipeline-level infrastructure."""

from __future__ import annotations

from typing import Protocol

from second_brain_ingester.pipeline.state import PipelineState


class CheckpointStore(Protocol):
    def save(self, state: PipelineState) -> None:
        ...


class QualityReportStore(Protocol):
    def write(self, state: PipelineState) -> None:
        ...
