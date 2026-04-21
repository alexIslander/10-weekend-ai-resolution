from __future__ import annotations

from pathlib import Path

from second_brain_ingester.ingest.components.chunk_normalizer import DeterministicChunkGenerator
from second_brain_ingester.ingest.components.text_loader import TextSourceLoader
from second_brain_ingester.ingest.orchestrator import IngestOrchestrator
from second_brain_ingester.notes.components.api_client import DryRunStructuredExtractionClient
from second_brain_ingester.notes.components.extractor import StructuredNoteExtractor
from second_brain_ingester.notes.components.linker import DeterministicNoteLinker
from second_brain_ingester.notes.orchestrator import NotesOrchestrator
from second_brain_ingester.output.components.markdown_writer import DeterministicMarkdownWriter
from second_brain_ingester.output.components.quality_reporter import PlaceholderQualityReporter
from second_brain_ingester.output.orchestrator import OutputOrchestrator
from second_brain_ingester.pipeline.runner import LocalPipelineRunner


def test_linker_flow_writes_cross_note_links(tmp_path: Path) -> None:
    runner = LocalPipelineRunner(
        ingest=IngestOrchestrator(
            loaders=[TextSourceLoader()],
            chunk_generator=DeterministicChunkGenerator(max_chunk_chars=80),
        ),
        notes=NotesOrchestrator(
            extractor=StructuredNoteExtractor(
                client=DryRunStructuredExtractionClient(),
                prompt_text="phase-4-linker-prompt",
            ),
            enrichers=[DeterministicNoteLinker()],
        ),
        output=OutputOrchestrator(
            writer=DeterministicMarkdownWriter(output_root=tmp_path),
            reporter=PlaceholderQualityReporter(),
        ),
    )

    state = runner.run(Path("tests/fixtures/sample.txt"), tmp_path)

    assert state.output is not None
    note_texts = [path.read_text(encoding="utf-8") for path in state.output.note_paths]

    assert len(note_texts) >= 2
    assert any("## Linked notes" in text for text in note_texts)
    assert any("[[" in text and "reference" in text for text in note_texts)
