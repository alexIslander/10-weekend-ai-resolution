"""Write deterministic markdown artifacts and a manifest."""

from __future__ import annotations

import json
from pathlib import Path

from second_brain_ingester.common.models import PipelineResult
from second_brain_ingester.pipeline.state import PipelineState


class DeterministicMarkdownWriter:
    def __init__(self, output_root: Path) -> None:
        self._output_root = output_root

    def write(self, state: PipelineState) -> PipelineState:
        run_dir = self._output_root / state.run_id
        atomics_dir = run_dir / "atomics"
        atomics_dir.mkdir(parents=True, exist_ok=True)

        note_paths: list[Path] = []
        for note in state.notes:
            note_path = atomics_dir / f"{note.slug}.md"
            note_path.write_text(self._render_note(note, state), encoding="utf-8")
            note_paths.append(note_path)

        manifest_path = run_dir / "manifest.json"
        manifest = {
            "run_id": state.run_id,
            "source": {
                "source_id": state.source_metadata.source_id,
                "type": state.source_metadata.source_type,
                "title": state.source_metadata.title,
                "input_path": str(state.source_metadata.input_path),
                "checksum_sha256": state.source_metadata.checksum_sha256,
            },
            "chunks": [
                {
                    "chunk_id": chunk.chunk_id,
                    "ordinal": chunk.ordinal,
                    "page_number": chunk.page_number,
                    "title": chunk.title,
                }
                for chunk in state.chunks
            ],
            "notes": [
                {
                    "note_id": note.note_id,
                    "slug": note.slug,
                    "title": note.title,
                }
                for note in state.notes
            ],
            "warnings": state.warnings,
            "errors": [
                {
                    "code": error.code,
                    "message": error.message,
                    "context": error.context,
                }
                for error in state.errors
            ],
        }
        manifest_path.write_text(json.dumps(manifest, indent=2, sort_keys=True), encoding="utf-8")
        state.output = PipelineResult(
            run_id=state.run_id,
            output_dir=run_dir,
            manifest_path=manifest_path,
            note_paths=note_paths,
        )
        return state

    def _render_note(self, note: object, state: PipelineState) -> str:
        from second_brain_ingester.common.models import AtomicNote

        typed_note = note if isinstance(note, AtomicNote) else None
        if typed_note is None:
            raise TypeError("Expected AtomicNote")

        tags = " ".join(f"#{tag}" for tag in typed_note.tags)
        chunk_links = ", ".join(typed_note.chunk_ids)
        related_links = ", ".join(typed_note.links)
        source_excerpt = typed_note.source_excerpt or ""
        return (
            "---\n"
            f"id: {typed_note.note_id}\n"
            f"title: {typed_note.title}\n"
            f"source: {state.source_metadata.title}\n"
            f"source_id: {state.source_metadata.source_id}\n"
            f"chunk_ids: [{chunk_links}]\n"
            f"tags: [{tags}]\n"
            f"links: [{related_links}]\n"
            "---\n\n"
            f"# {typed_note.title}\n\n"
            f"{typed_note.body}\n\n"
            f"## Source metadata\n\n"
            f"- Source type: `{state.source_metadata.source_type}`\n"
            f"- Input path: `{state.source_metadata.input_path}`\n"
            f"- Source excerpt: {source_excerpt}"
        )
