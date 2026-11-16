from __future__ import annotations

import json
from pathlib import Path

from second_brain_ingester.common.models import AtomicNote, ProcessedChunk, SourceMetadata
from second_brain_ingester.output.components.markdown_writer import DeterministicMarkdownWriter
from second_brain_ingester.pipeline.state import PipelineState


def test_markdown_writer_writes_manifest_and_note(tmp_path: Path) -> None:
    state = PipelineState(
        source_metadata=SourceMetadata(
            source_id="source-001",
            source_type="text",
            input_path=Path("sample.txt"),
            title="Sample",
            checksum_sha256="abc123",
            byte_size=10,
        ),
        chunks=[ProcessedChunk("chunk-001", "source-001", 1, "body", "Chunk 1")],
        notes=[
            AtomicNote(
                note_id="note-001",
                title="Sample note 1",
                slug="sample-note-1",
                note_type="concept",
                body="note body",
                source_id="source-001",
                chunk_ids=["chunk-001"],
                tags=["local-ingest"],
                links=["Sample reference"],
                source_excerpt="body",
            )
        ],
    )
    writer = DeterministicMarkdownWriter(output_root=tmp_path)

    written_state = writer.write(state)

    assert written_state.output is not None
    manifest = json.loads(written_state.output.manifest_path.read_text(encoding="utf-8"))
    note_text = written_state.output.note_paths[0].read_text(encoding="utf-8")

    assert manifest["source"]["source_id"] == "source-001"
    assert "sample-note-1.md" in str(written_state.output.note_paths[0])
    assert "id: note-001" in note_text
    assert "links: [Sample reference]" in note_text
    assert "## Source metadata" in note_text


def test_markdown_writer_replaces_stale_files_on_same_run_id(tmp_path: Path) -> None:
    state = PipelineState(
        source_metadata=SourceMetadata(
            source_id="source-001",
            source_type="text",
            input_path=Path("sample.txt"),
            title="Sample",
            checksum_sha256="abc123",
            byte_size=10,
        ),
        chunks=[ProcessedChunk("chunk-001", "source-001", 1, "body", "Chunk 1")],
        notes=[
            AtomicNote(
                note_id="note-001",
                title="Current note",
                slug="current-note",
                note_type="concept",
                body="note body",
                source_id="source-001",
                chunk_ids=["chunk-001"],
            )
        ],
    )
    run_dir = tmp_path / state.run_id
    stale_dir = run_dir / "atomics"
    stale_dir.mkdir(parents=True)
    stale_note = stale_dir / "stale-note.md"
    stale_note.write_text("stale", encoding="utf-8")
    writer = DeterministicMarkdownWriter(output_root=tmp_path)

    written_state = writer.write(state)

    assert written_state.output is not None
    assert not stale_note.exists()
    assert (run_dir / "atomics" / "current-note.md").exists()


def test_markdown_writer_routes_srqs_to_dedicated_directory(tmp_path: Path) -> None:
    state = PipelineState(
        source_metadata=SourceMetadata(
            source_id="source-001",
            source_type="text",
            input_path=Path("sample.txt"),
            title="Sample",
            checksum_sha256="abc123",
            byte_size=10,
        ),
        chunks=[ProcessedChunk("chunk-001", "source-001", 1, "body", "Chunk 1")],
        notes=[
            AtomicNote(
                note_id="note-001-srq",
                title="SRQ: Sample note 1",
                slug="sample-note-1-srq",
                note_type="srq",
                body="## Question\n\nWhat changes here?",
                source_id="source-001",
                chunk_ids=["chunk-001"],
                tags=["srq"],
                links=["Sample note 1"],
            )
        ],
    )
    writer = DeterministicMarkdownWriter(output_root=tmp_path)

    written_state = writer.write(state)

    assert written_state.output is not None
    assert "/srqs/" in written_state.output.note_paths[0].as_posix()


def test_markdown_writer_routes_anti_patterns_to_dedicated_directory(tmp_path: Path) -> None:
    state = PipelineState(
        source_metadata=SourceMetadata(
            source_id="source-001",
            source_type="text",
            input_path=Path("sample.txt"),
            title="Sample",
            checksum_sha256="abc123",
            byte_size=10,
        ),
        chunks=[ProcessedChunk("chunk-001", "source-001", 1, "body", "Chunk 1")],
        notes=[
            AtomicNote(
                note_id="note-001-anti-pattern",
                title="Anti-pattern: Sample note 1",
                slug="sample-note-1-anti-pattern",
                note_type="anti-pattern",
                body="## Failure mode\n\nDo not apply this blindly.",
                source_id="source-001",
                chunk_ids=["chunk-001"],
                tags=["anti-pattern"],
                links=["Sample note 1"],
            )
        ],
    )
    writer = DeterministicMarkdownWriter(output_root=tmp_path)

    written_state = writer.write(state)

    assert written_state.output is not None
    assert "/anti-patterns/" in written_state.output.note_paths[0].as_posix()


def test_markdown_writer_routes_mocs_to_dedicated_directory(tmp_path: Path) -> None:
    state = PipelineState(
        source_metadata=SourceMetadata(
            source_id="source-001",
            source_type="text",
            input_path=Path("sample.txt"),
            title="Sample",
            checksum_sha256="abc123",
            byte_size=10,
        ),
        chunks=[ProcessedChunk("chunk-001", "source-001", 1, "body", "Chunk 1")],
        notes=[
            AtomicNote(
                note_id="source-001-moc",
                title="MOC: source-001",
                slug="source-001-moc",
                note_type="moc",
                body="## Themes\n\n- [[Sample note 1]]\n\n```mermaid\nmindmap\n```",
                source_id="source-001",
                chunk_ids=["chunk-001"],
                tags=["moc"],
                links=["Sample note 1"],
            )
        ],
    )
    writer = DeterministicMarkdownWriter(output_root=tmp_path)

    written_state = writer.write(state)

    assert written_state.output is not None
    assert "/mocs/" in written_state.output.note_paths[0].as_posix()
