"""Protocols for writing pipeline artifacts."""

from __future__ import annotations

from typing import Protocol

from second_brain_ingester.pipeline.state import PipelineState


class MarkdownWriter(Protocol):
    def write(self, state: PipelineState) -> PipelineState:
        ...


class QualityReporter(Protocol):
    def build(self, state: PipelineState) -> str:
        ...
