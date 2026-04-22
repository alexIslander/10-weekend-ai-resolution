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
_CONTROL_GLYPH_PATTERN = re.compile(r"[\x00-\x08\x0b-\x1f\x7f-\x9f]")


def _decode_pdf_literal_bytes(raw_value: bytes) -> bytes:
    decoded = bytearray()
    index = 0
    while index < len(raw_value):
        current = raw_value[index]
        if current != 0x5C:
            decoded.append(current)
            index += 1
            continue

        index += 1
        if index >= len(raw_value):
            break

        escaped = raw_value[index]
        if escaped in b"nrtbf":
            decoded.extend(
                {
                    ord("n"): b"\n",
                    ord("r"): b"\r",
                    ord("t"): b"\t",
                    ord("b"): b"\b",
                    ord("f"): b"\f",
                }[escaped]
            )
        elif escaped in b"()\\":
            decoded.append(escaped)
        elif escaped in b"\n\r":
            if escaped == 0x0D and index + 1 < len(raw_value) and raw_value[index + 1] == 0x0A:
                index += 1
        elif 0x30 <= escaped <= 0x37:
            octal_digits = bytearray([escaped])
            while (
                index + 1 < len(raw_value)
                and len(octal_digits) < 3
                and 0x30 <= raw_value[index + 1] <= 0x37
            ):
                index += 1
                octal_digits.append(raw_value[index])
            decoded.append(int(octal_digits.decode("ascii"), 8))
        else:
            decoded.append(escaped)
        index += 1

    return bytes(decoded)


def _decode_pdf_bytes(payload: bytes) -> str:
    if not payload:
        return ""
    if payload.startswith(b"\xfe\xff"):
        return payload[2:].decode("utf-16-be", errors="ignore")
    if payload.startswith(b"\xff\xfe"):
        return payload[2:].decode("utf-16-le", errors="ignore")
    return payload.decode("cp1252", errors="ignore")


def _decode_bytes_with_cmap(payload: bytes, cmap: dict[str, str] | None) -> str:
    if not payload:
        return ""
    if not cmap:
        return _decode_pdf_bytes(payload)

    code_widths = sorted({max(1, len(code) // 2) for code in cmap}, reverse=True)
    decoded_chars: list[str] = []
    index = 0
    used_cmap = False

    while index < len(payload):
        matched = False
        for width in code_widths:
            if index + width > len(payload):
                continue
            code = payload[index : index + width].hex().upper()
            mapped_char = cmap.get(code)
            if mapped_char is None:
                continue
            decoded_chars.append(mapped_char)
            index += width
            matched = True
            used_cmap = True
            break
        if matched:
            continue
        decoded_chars.append(_decode_pdf_bytes(payload[index : index + 1]))
        index += 1

    decoded_text = "".join(decoded_chars)
    return decoded_text if used_cmap else _decode_pdf_bytes(payload)


def _decode_pdf_text(raw_value: bytes, cmap: dict[str, str] | None = None) -> str:
    return _decode_bytes_with_cmap(_decode_pdf_literal_bytes(raw_value), cmap)


def _decode_hex_text(raw_value: bytes) -> str:
    cleaned = re.sub(rb"\s+", b"", raw_value)
    if len(cleaned) % 2 == 1:
        cleaned += b"0"
    return _decode_pdf_bytes(bytes.fromhex(cleaned.decode("ascii")))


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

    payload = bytes.fromhex(cleaned)
    if len(payload) * 2 != len(cleaned) and code_width == 4:
        return _decode_hex_text(raw_value)
    return _decode_bytes_with_cmap(payload, cmap)


def _iter_text_fragments(stream: bytes, cmap: dict[str, str] | None = None) -> list[str]:
    fragments: list[str] = []

    for match in _TEXT_PATTERN.finditer(stream):
        literal = match.group("literal")
        hex_value = match.group("hex")
        if literal is not None:
            fragments.append(_decode_pdf_text(literal, cmap))
        elif hex_value is not None:
            fragments.append(_decode_with_cmap(hex_value, cmap))

    for array_match in _TEXT_ARRAY_PATTERN.finditer(stream):
        array_fragments: list[str] = []
        for entry in _TEXT_ARRAY_ENTRY_PATTERN.finditer(array_match.group(1)):
            literal = entry.group("literal")
            hex_value = entry.group("hex")
            if literal is not None:
                array_fragments.append(_decode_pdf_text(literal, cmap))
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


def _strip_control_glyphs(value: str) -> tuple[str, int]:
    stripped, count = _CONTROL_GLYPH_PATTERN.subn(" ", value)
    return stripped, count


def _extract_page_text(
    content_stream: bytes, font_maps: dict[str, dict[str, str]]
) -> tuple[str, set[str], int]:
    current_font: dict[str, str] | None = None
    current_font_name: str | None = None
    fragments: list[str] = []
    fonts_without_cmap: set[str] = set()

    for match in _TEXT_OPERATION_PATTERN.finditer(content_stream):
        font_name = match.group("font")
        if font_name is not None:
            current_font_name = font_name.decode("ascii")
            current_font = font_maps.get(current_font_name)
            if current_font is None:
                fonts_without_cmap.add(current_font_name)
            continue

        literal = match.group("literal")
        hex_value = match.group("hex")
        array_value = match.group("array")

        if literal is not None:
            fragments.append(_decode_pdf_text(literal, current_font))
        elif hex_value is not None:
            fragments.append(_decode_with_cmap(hex_value, current_font))
        elif array_value is not None:
            array_fragments: list[str] = []
            for entry in _TEXT_ARRAY_ENTRY_PATTERN.finditer(array_value):
                literal_entry = entry.group("literal")
                hex_entry = entry.group("hex")
                if literal_entry is not None:
                    array_fragments.append(_decode_pdf_text(literal_entry, current_font))
                elif hex_entry is not None:
                    array_fragments.append(_decode_with_cmap(hex_entry, current_font))
            if array_fragments:
                fragments.append("".join(array_fragments))

    cleaned_text, stripped_controls = _strip_control_glyphs(
        "".join(fragment for fragment in fragments if fragment)
    )
    return normalize_whitespace(cleaned_text), fonts_without_cmap, stripped_controls


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
            page_text, fonts_without_cmap, stripped_controls = _extract_page_text(
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
