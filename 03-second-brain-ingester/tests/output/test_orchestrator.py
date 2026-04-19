from __future__ import annotations

from pathlib import Path

from second_brain_ingester.common.models import SourceMetadata
from second_brain_ingester.output.orchestrator import OutputOrchestrator
from second_brain_ingester.pipeline.state import PipelineState


class FakeWriter:
    def write(self, state: PipelineState) -> PipelineState:
        state.warnings.append("writer-ran")
        return state


class FakeReporter:
    def build(self, state: PipelineState) -> str:
        return f"report-for-{state.source_metadata.source_id}"


def test_output_orchestrator_runs_writer_and_reporter() -> None:
    state = PipelineState(
        source_metadata=SourceMetadata(
            source_id="source-001",
            source_type="text",
            input_path=Path("sample.txt"),
            title="Sample",
            checksum_sha256="abc123",
            byte_size=10,
        )
    )
    orchestrator = OutputOrchestrator(writer=FakeWriter(), reporter=FakeReporter())

    written_state = orchestrator.write(state)

    assert written_state.warnings == ["writer-ran", "report-for-source-001"]
