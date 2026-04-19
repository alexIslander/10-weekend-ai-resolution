"""Placeholder quality reporter."""

from __future__ import annotations

from second_brain_ingester.pipeline.state import PipelineState


class PlaceholderQualityReporter:
    def build(self, state: PipelineState) -> str:
        return (
            f"quality-placeholder: {len(state.chunks)} chunks, "
            f"{len(state.notes)} notes, {len(state.errors)} errors"
        )
