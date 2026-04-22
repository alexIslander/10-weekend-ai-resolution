"""Local deterministic pipeline runner."""

from __future__ import annotations

from collections.abc import Callable, Iterator
from contextlib import contextmanager
from datetime import UTC, datetime
from pathlib import Path

from second_brain_ingester.common.models import ErrorPayload, MocSummary
from second_brain_ingester.ingest.orchestrator import IngestOrchestrator
from second_brain_ingester.notes.orchestrator import NotesOrchestrator
from second_brain_ingester.output.orchestrator import OutputOrchestrator
from second_brain_ingester.pipeline.state import (
    PipelineState,
    StageTiming,
    validate_output_directory,
)


class LocalPipelineRunner:
    def __init__(
        self,
        ingest: IngestOrchestrator,
        notes: NotesOrchestrator,
        output: OutputOrchestrator,
        status_callback: Callable[[str], None] | None = None,
    ) -> None:
        self._ingest = ingest
        self._notes = notes
        self._output = output
        self._status_callback = status_callback

    def run(self, input_path: Path, output_dir: Path) -> PipelineState:
        validate_output_directory(output_dir)
        stage_timings: list[StageTiming] = []
        with self._track_stage(stage_timings, "source_load", "Loading source"):
            source = self._ingest.load_source(input_path)
        with self._track_stage(stage_timings, "chunk_generation", "Generating chunks"):
            chunks = self._ingest.generate_chunks(source, input_path)

        state = PipelineState(
            source_metadata=source.metadata,
            chunks=chunks,
            warnings=list(source.warnings),
            stage_timings=stage_timings,
        )
        try:
            with self._track_stage(state.stage_timings, "extraction", "Extracting notes"):
                state.notes = self._notes.create_notes(chunks, source.metadata)
            moc_note = next((note for note in state.notes if note.note_type == "moc"), None)
            if moc_note is not None:
                linked_note_ids = [
                    note.note_id
                    for note in state.notes
                    if note.note_type != "moc" and note.title in moc_note.links
                ]
                state.moc = MocSummary(
                    note_id=moc_note.note_id,
                    title=moc_note.title,
                    linked_note_ids=linked_note_ids,
                    source_id=moc_note.source_id,
                )
            with self._track_stage(state.stage_timings, "artifact_write", "Writing artifacts"):
                return self._output.write(state)
        except ValueError as exc:
            state.errors.append(ErrorPayload(code="pipeline_error", message=str(exc)))
            return state

    @contextmanager
    def _track_stage(
        self,
        timings: list[StageTiming],
        stage: str,
        start_message: str,
    ) -> Iterator[None]:
        timing = StageTiming(stage=stage, started_at=_utc_now())
        timings.append(timing)
        self._emit_status(f"{start_message}...")
        try:
            yield
        finally:
            timing.mark_completed(_utc_now())
            duration = timing.duration_seconds
            duration_suffix = f" ({duration:.3f}s)" if duration is not None else ""
            self._emit_status(f"Completed {stage}.{duration_suffix}")

    def _emit_status(self, message: str) -> None:
        if self._status_callback is not None:
            self._status_callback(message)


def _utc_now() -> datetime:
    return datetime.now(UTC)
