"""Deterministic loader for simple text-based PDF fixtures."""

from __future__ import annotations

import re
import zlib
from pathlib import Path

from second_brain_ingester.common.models import LoadedSource, RawContentUnit, SourceMetadata
from second_brain_ingester.ingest.components.common import (
    compute_checksum,
    make_source_id,
    normalize_whitespace,
)

_STREAM_PATTERN = re.compile(rb"stream\s*(.*?)\s*endstream", re.DOTALL)
_OBJECT_PATTERN = re.compile(rb"(\d+)\s+(\d+)\s+obj(.*?)endobj", re.DOTALL)
_PAGE_PATTERN = re.compile(rb"/Type/Page\b")
_CONTENTS_PATTERN = re.compile(rb"/Contents\s+(\d+)\s+0\s+R")
_FONT_RESOURCE_PATTERN = re.compile(rb"/(F[\w]+)\s+(\d+)\s+0\s+R")
_TO_UNICODE_PATTERN = re.compile(rb"/ToUnicode\s+(\d+)\s+0\s+R")
_TEXT_OPERATION_PATTERN = re.compile(
    rb"/(?P<font>F[\w]+)\s+[\d.]+\s+Tf|"
    rb"\((?P<literal>(?:\\.|[^\\)])*)\)\s*Tj|"
    rb"<(?P<hex>[0-9A-Fa-f\s]+)>\s*Tj|"
    rb"\[(?P<array>.*?)\]\s*TJ",
    re.DOTALL,
)
_TEXT_PATTERN = re.compile(
    rb"\((?P<literal>(?:\\.|[^\\)])*)\)\s*Tj|<(?P<hex>[0-9A-Fa-f\s]+)>\s*Tj",
    re.DOTALL,
)
_TEXT_ARRAY_PATTERN = re.compile(rb"\[(.*?)\]\s*TJ", re.DOTALL)
_TEXT_ARRAY_ENTRY_PATTERN = re.compile(
    rb"\((?P<literal>(?:\\.|[^\\)])*)\)|<(?P<hex>[0-9A-Fa-f\s]+)>"
)


def _decode_pdf_text(raw_value: bytes) -> str:
    text = raw_value.replace(rb"\(", b"(").replace(rb"\)", b")").replace(rb"\\", b"\\")
    return text.decode("latin-1")


def _decode_hex_text(raw_value: bytes) -> str:
    cleaned = re.sub(rb"\s+", b"", raw_value)
    if len(cleaned) % 2 == 1:
        cleaned += b"0"
    payload = bytes.fromhex(cleaned.decode("ascii"))
    if not payload:
        return ""

    if len(payload) % 2 == 0:
        try:
            return payload.decode("utf-16-be")
        except UnicodeDecodeError:
            pass

    return payload.decode("latin-1", errors="ignore")


def _decode_with_cmap(raw_value: bytes, cmap: dict[str, str] | None) -> str:
    cleaned = re.sub(rb"\s+", b"", raw_value).decode("ascii")
    if not cmap:
        return _decode_hex_text(raw_value)

    if len(cleaned) % 4 == 0:
        code_width = 4
    elif len(cleaned) % 2 == 0:
        code_width = 2
    else:
        return _decode_hex_text(raw_value)

    decoded_chars: list[str] = []
    for index in range(0, len(cleaned), code_width):
        code = cleaned[index : index + code_width].upper()
        decoded_chars.append(cmap.get(code, ""))
    decoded_text = "".join(decoded_chars)
    return decoded_text or _decode_hex_text(raw_value)


def _iter_text_fragments(stream: bytes, cmap: dict[str, str] | None = None) -> list[str]:
    fragments: list[str] = []

    for match in _TEXT_PATTERN.finditer(stream):
        literal = match.group("literal")
        hex_value = match.group("hex")
        if literal is not None:
            fragments.append(_decode_pdf_text(literal))
        elif hex_value is not None:
            fragments.append(_decode_with_cmap(hex_value, cmap))

    for array_match in _TEXT_ARRAY_PATTERN.finditer(stream):
        array_fragments: list[str] = []
        for entry in _TEXT_ARRAY_ENTRY_PATTERN.finditer(array_match.group(1)):
            literal = entry.group("literal")
            hex_value = entry.group("hex")
            if literal is not None:
                array_fragments.append(_decode_pdf_text(literal))
            elif hex_value is not None:
                array_fragments.append(_decode_with_cmap(hex_value, cmap))
        if array_fragments:
            fragments.append("".join(array_fragments))

    return fragments


def _inflate_stream(stream: bytes) -> bytes:
    try:
        return zlib.decompress(stream)
    except zlib.error:
        return stream


def _parse_objects(payload: bytes) -> dict[int, bytes]:
    return {int(match.group(1)): match.group(3) for match in _OBJECT_PATTERN.finditer(payload)}


def _extract_stream(body: bytes) -> bytes | None:
    stream_match = _STREAM_PATTERN.search(body)
    if stream_match is None:
        return None
    return _inflate_stream(stream_match.group(1))


def _parse_tounicode_map(stream: bytes) -> dict[str, str]:
    mapping: dict[str, str] = {}
    text = stream.decode("latin-1", errors="ignore")
    lines = [line.strip() for line in text.splitlines()]
    index = 0

    while index < len(lines):
        line = lines[index]
        if line.endswith("beginbfchar"):
            index += 1
            while index < len(lines) and lines[index] != "endbfchar":
                match = re.match(r"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>", lines[index])
                if match:
                    mapping[match.group(1).upper()] = chr(int(match.group(2), 16))
                index += 1
        elif line.endswith("beginbfrange"):
            index += 1
            while index < len(lines) and lines[index] != "endbfrange":
                match = re.match(
                    r"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>",
                    lines[index],
                )
                if match:
                    start = int(match.group(1), 16)
                    end = int(match.group(2), 16)
                    dest = int(match.group(3), 16)
                    width = len(match.group(1))
                    for offset, codepoint in enumerate(range(start, end + 1)):
                        mapping[f"{codepoint:0{width}X}"] = chr(dest + offset)
                index += 1
        index += 1

    return mapping


def _build_font_maps(objects: dict[int, bytes], page_body: bytes) -> dict[str, dict[str, str]]:
    font_maps: dict[str, dict[str, str]] = {}
    for font_name, font_object in _FONT_RESOURCE_PATTERN.findall(page_body):
        font_body = objects.get(int(font_object))
        if font_body is None:
            continue
        to_unicode_match = _TO_UNICODE_PATTERN.search(font_body)
        if to_unicode_match is None:
            continue
        cmap_body = objects.get(int(to_unicode_match.group(1)))
        if cmap_body is None:
            continue
        cmap_stream = _extract_stream(cmap_body)
        if cmap_stream is None:
            continue
        font_maps[font_name.decode("ascii")] = _parse_tounicode_map(cmap_stream)
    return font_maps


def _extract_page_text(content_stream: bytes, font_maps: dict[str, dict[str, str]]) -> str:
    current_font: dict[str, str] | None = None
    fragments: list[str] = []

    for match in _TEXT_OPERATION_PATTERN.finditer(content_stream):
        font_name = match.group("font")
        if font_name is not None:
            current_font = font_maps.get(font_name.decode("ascii"))
            continue

        literal = match.group("literal")
        hex_value = match.group("hex")
        array_value = match.group("array")

        if literal is not None:
            fragments.append(_decode_pdf_text(literal))
        elif hex_value is not None:
            fragments.append(_decode_with_cmap(hex_value, current_font))
        elif array_value is not None:
            array_fragments: list[str] = []
            for entry in _TEXT_ARRAY_ENTRY_PATTERN.finditer(array_value):
                literal_entry = entry.group("literal")
                hex_entry = entry.group("hex")
                if literal_entry is not None:
                    array_fragments.append(_decode_pdf_text(literal_entry))
                elif hex_entry is not None:
                    array_fragments.append(_decode_with_cmap(hex_entry, current_font))
            if array_fragments:
                fragments.append("".join(array_fragments))

    return normalize_whitespace("".join(fragment for fragment in fragments if fragment))


class PdfSourceLoader:
    def can_load(self, path: Path) -> bool:
        return path.suffix.lower() == ".pdf"

    def load(self, path: Path) -> LoadedSource:
        payload = path.read_bytes()
        checksum = compute_checksum(path)
        source_id = make_source_id(path, checksum)
        objects = _parse_objects(payload)
        units: list[RawContentUnit] = []
        warnings: list[str] = []

        page_index = 0
        for object_id in sorted(objects):
            page_body = objects[object_id]
            if _PAGE_PATTERN.search(page_body) is None:
                continue
            contents_match = _CONTENTS_PATTERN.search(page_body)
            if contents_match is None:
                continue
            content_body = objects.get(int(contents_match.group(1)))
            if content_body is None:
                continue
            content_stream = _extract_stream(content_body)
            if content_stream is None:
                continue
            page_index += 1
            font_maps = _build_font_maps(objects, page_body)
            page_text = _extract_page_text(content_stream, font_maps)
            if not page_text:
                continue
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
            streams = _STREAM_PATTERN.findall(payload)
            for index, stream in enumerate(streams, start=1):
                inflated_stream = _inflate_stream(stream)
                text_fragments = _iter_text_fragments(inflated_stream)
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
