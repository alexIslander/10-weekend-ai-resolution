"""Text decoding helpers for the deterministic PDF loader."""

from __future__ import annotations

import re

from second_brain_ingester.ingest.components.common import normalize_whitespace

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


def decode_pdf_literal_bytes(raw_value: bytes) -> bytes:
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


def decode_pdf_bytes(payload: bytes) -> str:
    if not payload:
        return ""
    if payload.startswith(b"\xfe\xff"):
        return payload[2:].decode("utf-16-be", errors="ignore")
    if payload.startswith(b"\xff\xfe"):
        return payload[2:].decode("utf-16-le", errors="ignore")
    return payload.decode("cp1252", errors="ignore")


def decode_bytes_with_cmap(payload: bytes, cmap: dict[str, str] | None) -> str:
    if not payload:
        return ""
    if not cmap:
        return decode_pdf_bytes(payload)

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
        decoded_chars.append(decode_pdf_bytes(payload[index : index + 1]))
        index += 1

    decoded_text = "".join(decoded_chars)
    return decoded_text if used_cmap else decode_pdf_bytes(payload)


def decode_pdf_text(raw_value: bytes, cmap: dict[str, str] | None = None) -> str:
    return decode_bytes_with_cmap(decode_pdf_literal_bytes(raw_value), cmap)


def decode_hex_text(raw_value: bytes) -> str:
    cleaned = re.sub(rb"\s+", b"", raw_value)
    if len(cleaned) % 2 == 1:
        cleaned += b"0"
    return decode_pdf_bytes(bytes.fromhex(cleaned.decode("ascii")))


def decode_with_cmap(raw_value: bytes, cmap: dict[str, str] | None) -> str:
    cleaned = re.sub(rb"\s+", b"", raw_value).decode("ascii")
    if not cmap:
        return decode_hex_text(raw_value)

    if len(cleaned) % 4 == 0:
        code_width = 4
    elif len(cleaned) % 2 == 0:
        code_width = 2
    else:
        return decode_hex_text(raw_value)

    payload = bytes.fromhex(cleaned)
    if len(payload) * 2 != len(cleaned) and code_width == 4:
        return decode_hex_text(raw_value)
    return decode_bytes_with_cmap(payload, cmap)


def iter_text_fragments(stream: bytes, cmap: dict[str, str] | None = None) -> list[str]:
    fragments: list[str] = []

    for match in _TEXT_PATTERN.finditer(stream):
        literal = match.group("literal")
        hex_value = match.group("hex")
        if literal is not None:
            fragments.append(decode_pdf_text(literal, cmap))
        elif hex_value is not None:
            fragments.append(decode_with_cmap(hex_value, cmap))

    for array_match in _TEXT_ARRAY_PATTERN.finditer(stream):
        array_fragments: list[str] = []
        for entry in _TEXT_ARRAY_ENTRY_PATTERN.finditer(array_match.group(1)):
            literal = entry.group("literal")
            hex_value = entry.group("hex")
            if literal is not None:
                array_fragments.append(decode_pdf_text(literal, cmap))
            elif hex_value is not None:
                array_fragments.append(decode_with_cmap(hex_value, cmap))
        if array_fragments:
            fragments.append("".join(array_fragments))

    return fragments


def strip_control_glyphs(value: str) -> tuple[str, int]:
    stripped, count = _CONTROL_GLYPH_PATTERN.subn(" ", value)
    return stripped, count


def extract_page_text(
    content_stream: bytes, font_maps: dict[str, dict[str, str]]
) -> tuple[str, set[str], int]:
    current_font: dict[str, str] | None = None
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
            fragments.append(decode_pdf_text(literal, current_font))
        elif hex_value is not None:
            fragments.append(decode_with_cmap(hex_value, current_font))
        elif array_value is not None:
            array_fragments: list[str] = []
            for entry in _TEXT_ARRAY_ENTRY_PATTERN.finditer(array_value):
                literal_entry = entry.group("literal")
                hex_entry = entry.group("hex")
                if literal_entry is not None:
                    array_fragments.append(decode_pdf_text(literal_entry, current_font))
                elif hex_entry is not None:
                    array_fragments.append(decode_with_cmap(hex_entry, current_font))
            if array_fragments:
                fragments.append("".join(array_fragments))

    cleaned_text, stripped_controls = strip_control_glyphs(
        "".join(fragment for fragment in fragments if fragment)
    )
    return normalize_whitespace(cleaned_text), fonts_without_cmap, stripped_controls
