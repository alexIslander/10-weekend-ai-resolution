"""Command-line entrypoint for the project."""

from __future__ import annotations

import argparse
from collections.abc import Sequence
from pathlib import Path

from second_brain_ingester.common.config import get_settings
from second_brain_ingester.common.logging import configure_logging
from second_brain_ingester.ingest.components.chunk_normalizer import DeterministicChunkGenerator
from second_brain_ingester.ingest.components.pdf_loader import PdfSourceLoader
from second_brain_ingester.ingest.components.text_loader import TextSourceLoader
from second_brain_ingester.ingest.orchestrator import IngestOrchestrator
from second_brain_ingester.notes.components.adr import DeterministicAdrGenerator
from second_brain_ingester.notes.components.anti_pattern import DeterministicAntiPatternGenerator
from second_brain_ingester.notes.components.api_client import (
    DryRunStructuredExtractionClient,
    OllamaStructuredExtractionClient,
)
from second_brain_ingester.notes.components.extractor import (
    StructuredNoteExtractor,
    load_extractor_prompt,
)
from second_brain_ingester.notes.components.linker import DeterministicNoteLinker
from second_brain_ingester.notes.components.moc import DeterministicMocGenerator
from second_brain_ingester.notes.components.srq import DeterministicSrqGenerator
from second_brain_ingester.notes.orchestrator import NotesOrchestrator
from second_brain_ingester.output.components.markdown_writer import DeterministicMarkdownWriter
from second_brain_ingester.output.components.quality_reporter import PlaceholderQualityReporter
from second_brain_ingester.output.orchestrator import OutputOrchestrator
from second_brain_ingester.pipeline.runner import LocalPipelineRunner


def build_parser() -> argparse.ArgumentParser:
    settings = get_settings()
    parser = argparse.ArgumentParser(
        prog="second-brain-ingester",
        description="Ingest source material into second-brain artifacts.",
    )
    parser.add_argument(
        "--version",
        action="version",
        version="second-brain-ingester 0.1.0",
    )
    subparsers = parser.add_subparsers(dest="command")
    run_parser = subparsers.add_parser(
        "run",
        help="Run the deterministic local ingest pipeline.",
    )
    run_parser.add_argument(
        "--input",
        required=True,
        type=Path,
        help="Path to a local text or PDF source.",
    )
    run_parser.add_argument(
        "--output-dir",
        type=Path,
        default=settings.output_dir,
        help="Directory where generated artifacts should be written.",
    )
    run_parser.add_argument(
        "--dry-run",
        action=argparse.BooleanOptionalAction,
        default=settings.dry_run,
        help="Keep the flow local and deterministic.",
    )
    run_parser.add_argument(
        "--provider",
        choices=["dry-run", "ollama"],
        default=settings.provider,
        help="Structured extraction provider to use for the extractor path.",
    )
    run_parser.add_argument(
        "--model",
        default=settings.model,
        help="Model name for the configured structured extraction provider.",
    )
    run_parser.add_argument(
        "--enable",
        action="append",
        default=[],
        choices=["extractor", "linker", "srq", "anti-pattern", "adr", "moc"],
        help=(
            "Enable individual pipeline slices. "
            "`extractor`, `linker`, `srq`, `anti-pattern`, `adr`, and `moc` are supported."
        ),
    )
    run_parser.add_argument(
        "--emit-extracted-source-markdown",
        action="store_true",
        help=(
            "Write one review-focused markdown file containing the extracted source text "
            "seen by downstream extraction."
        ),
    )
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    configure_logging()
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.command != "run":
        return 0

    if not args.input.exists():
        parser.error(f"Input path does not exist: {args.input}")
    if args.dry_run and args.provider == "ollama":
        parser.error("Use --no-dry-run with --provider ollama for real local runs.")
    if not args.dry_run and args.provider != "ollama":
        parser.error("Only --provider ollama is supported for non-dry-run runs.")
    if args.enable:
        unsupported = sorted(
            set(args.enable) - {"extractor", "linker", "srq", "anti-pattern", "adr", "moc"}
        )
        if unsupported:
            parser.error(f"Unsupported pipeline slices requested: {', '.join(unsupported)}")

    prompt_path = Path(__file__).resolve().parent / "notes" / "prompts" / "extractor.md"
    extractor = StructuredNoteExtractor(
        client=_build_extraction_client(
            dry_run=args.dry_run,
            provider=args.provider,
            model=args.model,
            prompt_path=prompt_path,
        ),
        prompt_text=load_extractor_prompt(prompt_path),
    )
    enrichers = []
    if "linker" in args.enable:
        enrichers.append(DeterministicNoteLinker())
    if "srq" in args.enable:
        enrichers.append(DeterministicSrqGenerator())
    if "anti-pattern" in args.enable:
        enrichers.append(DeterministicAntiPatternGenerator())
    if "adr" in args.enable:
        enrichers.append(DeterministicAdrGenerator())
    if "moc" in args.enable:
        enrichers.append(DeterministicMocGenerator())

    runner = LocalPipelineRunner(
        ingest=IngestOrchestrator(
            loaders=[TextSourceLoader(), PdfSourceLoader()],
            chunk_generator=DeterministicChunkGenerator(max_chunk_chars=get_settings().max_chunk_chars),
        ),
        notes=NotesOrchestrator(extractor=extractor, enrichers=enrichers),
        output=OutputOrchestrator(
            writer=DeterministicMarkdownWriter(output_root=args.output_dir),
            reporter=PlaceholderQualityReporter(),
        ),
    )
    state = runner.run(input_path=args.input, output_dir=args.output_dir)
    if state.output is None:
        parser.exit(status=1, message="Pipeline failed before writing output.\n")
    if args.emit_extracted_source_markdown:
        artifact_path = _write_extracted_source_markdown(state)
        print(f"Wrote extracted source markdown to {artifact_path}")
    print(f"Wrote run artifacts to {state.output.output_dir}")
    return 0


def _build_extraction_client(
    *,
    dry_run: bool,
    provider: str,
    model: str,
    prompt_path: Path,
) -> DryRunStructuredExtractionClient | OllamaStructuredExtractionClient:
    if dry_run:
        return DryRunStructuredExtractionClient(prompt_path=prompt_path)

    settings = get_settings()
    if provider != "ollama":
        raise ValueError(f"Unsupported non-dry-run provider: {provider}")
    return OllamaStructuredExtractionClient(
        model=model,
        base_url=settings.ollama_base_url,
        prompt_path=prompt_path,
        timeout_seconds=settings.ollama_timeout_seconds,
    )


def _write_extracted_source_markdown(state: object) -> Path:
    from second_brain_ingester.pipeline.state import PipelineState

    typed_state = state if isinstance(state, PipelineState) else None
    if typed_state is None or typed_state.output is None:
        raise ValueError("Extracted source markdown requires a completed pipeline output.")

    artifact_path = typed_state.output.output_dir / "extracted-source.md"
    chunk_sections: list[str] = []
    for chunk in typed_state.chunks:
        heading = f"## Chunk {chunk.ordinal:03d}: {chunk.title}"
        page_line = (
            f"- Page: {chunk.page_number}\n"
            if chunk.page_number is not None
            else ""
        )
        chunk_sections.append(
            (
                f"{heading}\n\n"
                f"- Chunk ID: `{chunk.chunk_id}`\n"
                f"{page_line}"
                f"\n{chunk.text}"
            ).strip()
        )

    artifact_path.write_text(
        (
            f"# Extracted source: {typed_state.source_metadata.title}\n\n"
            f"- Source type: `{typed_state.source_metadata.source_type}`\n"
            f"- Input path: `{typed_state.source_metadata.input_path}`\n"
            f"- Source ID: `{typed_state.source_metadata.source_id}`\n"
            f"- Chunk count: {len(typed_state.chunks)}\n"
            f"- Warning count: {len(typed_state.warnings)}\n\n"
            f"{'\n\n'.join(chunk_sections)}\n"
        ),
        encoding="utf-8",
    )
    return artifact_path


if __name__ == "__main__":
    raise SystemExit(main())
