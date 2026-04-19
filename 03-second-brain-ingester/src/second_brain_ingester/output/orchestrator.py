"""Coordinates output writing and reporting."""

from __future__ import annotations

from second_brain_ingester.output.protocols import MarkdownWriter, QualityReporter
from second_brain_ingester.pipeline.state import PipelineState


class OutputOrchestrator:
    def __init__(self, writer: MarkdownWriter, reporter: QualityReporter | None = None) -> None:
        self._writer = writer
        self._reporter = reporter

    def write(self, state: PipelineState) -> PipelineState:
        written_state = self._writer.write(state)
        if self._reporter is not None:
            report = self._reporter.build(written_state)
            written_state.warnings.append(report)
        return written_state
