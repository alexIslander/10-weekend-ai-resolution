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
from second_brain_ingester.notes.components.api_client import DryRunStructuredExtractionClient
from second_brain_ingester.notes.components.extractor import (
    StructuredNoteExtractor,
    load_extractor_prompt,
)
from second_brain_ingester.notes.components.linker import DeterministicNoteLinker
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
        "--enable",
        action="append",
        default=[],
        choices=["extractor", "linker", "srq"],
        help="Enable individual pipeline slices. `extractor`, `linker`, and `srq` are supported.",
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
    if not args.dry_run:
        parser.error("Only --dry-run is supported in the current implementation.")
    if args.enable:
        unsupported = sorted(set(args.enable) - {"extractor", "linker", "srq"})
        if unsupported:
            parser.error(f"Unsupported pipeline slices requested: {', '.join(unsupported)}")

    prompt_path = Path(__file__).resolve().parent / "notes" / "prompts" / "extractor.md"
    extractor = StructuredNoteExtractor(
        client=DryRunStructuredExtractionClient(prompt_path=prompt_path),
        prompt_text=load_extractor_prompt(prompt_path),
    )
    enrichers = []
    if "linker" in args.enable:
        enrichers.append(DeterministicNoteLinker())
    if "srq" in args.enable:
        enrichers.append(DeterministicSrqGenerator())

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
    print(f"Wrote run artifacts to {state.output.output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
