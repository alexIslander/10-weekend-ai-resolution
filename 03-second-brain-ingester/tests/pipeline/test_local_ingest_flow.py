from __future__ import annotations

import json
from pathlib import Path

from second_brain_ingester.ingest.components.chunk_normalizer import DeterministicChunkGenerator
from second_brain_ingester.ingest.components.pdf_loader import PdfSourceLoader
from second_brain_ingester.ingest.components.text_loader import TextSourceLoader
from second_brain_ingester.ingest.orchestrator import IngestOrchestrator
from second_brain_ingester.notes.components.api_client import DryRunStructuredExtractionClient
from second_brain_ingester.notes.components.extractor import StructuredNoteExtractor
from second_brain_ingester.notes.orchestrator import NotesOrchestrator
from second_brain_ingester.output.components.markdown_writer import DeterministicMarkdownWriter
from second_brain_ingester.output.components.quality_reporter import PlaceholderQualityReporter
from second_brain_ingester.output.orchestrator import OutputOrchestrator
from second_brain_ingester.pipeline.runner import LocalPipelineRunner


def _build_runner(tmp_path: Path) -> LocalPipelineRunner:
    return LocalPipelineRunner(
        ingest=IngestOrchestrator(
            loaders=[TextSourceLoader(), PdfSourceLoader()],
            chunk_generator=DeterministicChunkGenerator(max_chunk_chars=120),
        ),
        notes=NotesOrchestrator(
            extractor=StructuredNoteExtractor(
                client=DryRunStructuredExtractionClient(),
                prompt_text="phase-3-test-prompt",
            )
        ),
        output=OutputOrchestrator(
            writer=DeterministicMarkdownWriter(output_root=tmp_path),
            reporter=PlaceholderQualityReporter(),
        ),
    )


def test_local_ingest_flow_writes_deterministic_output(tmp_path: Path) -> None:
    state = _build_runner(tmp_path).run(Path("tests/fixtures/sample.txt"), tmp_path)

    assert state.output is not None
    assert state.output.manifest_path.exists()
    assert state.output.note_paths[0].exists()


def test_local_ingest_flow_supports_pdf_fixture(tmp_path: Path) -> None:
    state = _build_runner(tmp_path).run(Path("tests/fixtures/sample.pdf"), tmp_path)

    assert state.output is not None
    assert state.output.output_dir.exists()


def test_local_ingest_flow_records_stage_timings(tmp_path: Path) -> None:
    state = _build_runner(tmp_path).run(Path("tests/fixtures/sample.txt"), tmp_path)

    assert state.output is not None
    manifest = json.loads(state.output.manifest_path.read_text(encoding="utf-8"))

    timings = manifest["timings"]
    assert [entry["stage"] for entry in timings] == [
        "source_load",
        "chunk_generation",
        "extraction",
        "artifact_write",
    ]
    assert all(entry["started_at"] for entry in timings)
    assert all(entry["completed_at"] for entry in timings)
    assert all(entry["duration_seconds"] is not None for entry in timings)
