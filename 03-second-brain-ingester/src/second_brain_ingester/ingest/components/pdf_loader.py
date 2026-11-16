"""Deterministic loader for simple text-based PDF fixtures."""

from __future__ import annotations

from pathlib import Path

from second_brain_ingester.common.models import LoadedSource, RawContentUnit, SourceMetadata
from second_brain_ingester.ingest.components.common import (
    compute_checksum,
    make_source_id,
    normalize_whitespace,
)
from second_brain_ingester.ingest.components.pdf_loader_parsing import (
    build_font_maps,
    extract_stream,
    find_contents_object_id,
    is_page_object,
    iter_raw_streams,
    parse_objects,
)
from second_brain_ingester.ingest.components.pdf_loader_text import (
    extract_page_text,
    iter_text_fragments,
)


class PdfSourceLoader:
    def can_load(self, path: Path) -> bool:
        return path.suffix.lower() == ".pdf"

    def load(self, path: Path) -> LoadedSource:
        payload = path.read_bytes()
        checksum = compute_checksum(path)
        source_id = make_source_id(path, checksum)
        objects = parse_objects(payload)
        units: list[RawContentUnit] = []
        warnings: list[str] = []

        page_index = 0
        for object_id in sorted(objects):
            page_body = objects[object_id]
            if not is_page_object(page_body):
                continue
            contents_object_id = find_contents_object_id(page_body)
            if contents_object_id is None:
                continue
            content_body = objects.get(contents_object_id)
            if content_body is None:
                continue
            content_stream = extract_stream(content_body)
            if content_stream is None:
                continue
            page_index += 1
            font_maps = build_font_maps(objects, page_body)
            page_text, fonts_without_cmap, stripped_controls = extract_page_text(
                content_stream, font_maps
            )
            if not page_text:
                continue
            if fonts_without_cmap:
                warnings.append(
                    "PDF page "
                    f"{page_index} used fonts without ToUnicode maps "
                    f"({', '.join(sorted(fonts_without_cmap))}); output may retain layout noise."
                )
            if stripped_controls:
                warnings.append(
                    f"PDF page {page_index} had {stripped_controls} control glyphs stripped "
                    "during extraction."
                )
            units.append(
                RawContentUnit(
                    unit_id=f"{source_id}-page-{page_index:03d}",
                    unit_type="pdf_page",
                    text=page_text,
                    ordinal=page_index,
                    page_number=page_index,
                )
            )

        if not units:
            for index, stream in enumerate(iter_raw_streams(payload), start=1):
                text_fragments = iter_text_fragments(stream)
                joined_text = "".join(fragment for fragment in text_fragments if fragment)
                page_text = normalize_whitespace(joined_text)
                if not page_text:
                    continue
                units.append(
                    RawContentUnit(
                        unit_id=f"{source_id}-page-{index:03d}",
                        unit_type="pdf_page",
                        text=page_text,
                        ordinal=index,
                        page_number=index,
                    )
                )

        if not units:
            raise ValueError(f"Unable to extract text from PDF: {path}")

        warnings.append(
            "PDF extraction currently supports text-based stream content; "
            "image-only PDFs are not yet handled."
        )
        metadata = SourceMetadata(
            source_id=source_id,
            source_type="pdf",
            input_path=path,
            title=path.stem.replace("-", " ").title(),
            checksum_sha256=checksum,
            byte_size=path.stat().st_size,
            page_count=len(units),
        )
        return LoadedSource(metadata=metadata, units=units, warnings=warnings)
