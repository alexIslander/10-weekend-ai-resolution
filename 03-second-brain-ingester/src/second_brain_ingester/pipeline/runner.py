"""Local deterministic pipeline runner."""

from __future__ import annotations

from pathlib import Path

from second_brain_ingester.common.models import ErrorPayload
from second_brain_ingester.ingest.orchestrator import IngestOrchestrator
from second_brain_ingester.notes.orchestrator import NotesOrchestrator
from second_brain_ingester.output.orchestrator import OutputOrchestrator
from second_brain_ingester.pipeline.state import PipelineState, validate_output_directory


class LocalPipelineRunner:
    def __init__(
        self,
        ingest: IngestOrchestrator,
        notes: NotesOrchestrator,
        output: OutputOrchestrator,
    ) -> None:
        self._ingest = ingest
        self._notes = notes
        self._output = output

    def run(self, input_path: Path, output_dir: Path) -> PipelineState:
        validate_output_directory(output_dir)
        source, chunks = self._ingest.ingest(input_path)
        state = PipelineState(
            source_metadata=source.metadata,
            chunks=chunks,
            warnings=list(source.warnings),
        )
        try:
            state.notes = self._notes.create_notes(chunks, source.metadata)
            return self._output.write(state)
        except ValueError as exc:
            state.errors.append(ErrorPayload(code="pipeline_error", message=str(exc)))
            return state
