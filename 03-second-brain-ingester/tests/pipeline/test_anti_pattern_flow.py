from __future__ import annotations

from pathlib import Path

from second_brain_ingester.ingest.components.chunk_normalizer import DeterministicChunkGenerator
from second_brain_ingester.ingest.components.text_loader import TextSourceLoader
from second_brain_ingester.ingest.orchestrator import IngestOrchestrator
from second_brain_ingester.notes.components.anti_pattern import DeterministicAntiPatternGenerator
from second_brain_ingester.notes.components.api_client import DryRunStructuredExtractionClient
from second_brain_ingester.notes.components.extractor import StructuredNoteExtractor
from second_brain_ingester.notes.orchestrator import NotesOrchestrator
from second_brain_ingester.output.components.markdown_writer import DeterministicMarkdownWriter
from second_brain_ingester.output.components.quality_reporter import PlaceholderQualityReporter
from second_brain_ingester.output.orchestrator import OutputOrchestrator
from second_brain_ingester.pipeline.runner import LocalPipelineRunner


def test_anti_pattern_flow_writes_warning_notes_into_dedicated_directory(tmp_path: Path) -> None:
    runner = LocalPipelineRunner(
        ingest=IngestOrchestrator(
            loaders=[TextSourceLoader()],
            chunk_generator=DeterministicChunkGenerator(max_chunk_chars=120),
        ),
        notes=NotesOrchestrator(
            extractor=StructuredNoteExtractor(
                client=DryRunStructuredExtractionClient(),
                prompt_text="phase-4-anti-pattern-prompt",
            ),
            enrichers=[DeterministicAntiPatternGenerator()],
        ),
        output=OutputOrchestrator(
            writer=DeterministicMarkdownWriter(output_root=tmp_path),
            reporter=PlaceholderQualityReporter(),
        ),
    )

    state = runner.run(Path("tests/fixtures/sample.txt"), tmp_path)

    assert state.output is not None
    anti_pattern_paths = [
        path for path in state.output.note_paths if "/anti-patterns/" in path.as_posix()
    ]

    assert anti_pattern_paths
    anti_pattern_text = anti_pattern_paths[0].read_text(encoding="utf-8")
    assert "## Failure mode" in anti_pattern_text
    assert "tags: [#anti-pattern" in anti_pattern_text
