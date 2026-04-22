"""Parsing helpers for the deterministic PDF loader."""

from __future__ import annotations

import re
import zlib

_STREAM_PATTERN = re.compile(rb"stream\s*(.*?)\s*endstream", re.DOTALL)
_OBJECT_PATTERN = re.compile(rb"(\d+)\s+(\d+)\s+obj(.*?)endobj", re.DOTALL)
_PAGE_PATTERN = re.compile(rb"/Type/Page\b")
_CONTENTS_PATTERN = re.compile(rb"/Contents\s+(\d+)\s+0\s+R")
_FONT_RESOURCE_PATTERN = re.compile(rb"/(F[\w]+)\s+(\d+)\s+0\s+R")
_TO_UNICODE_PATTERN = re.compile(rb"/ToUnicode\s+(\d+)\s+0\s+R")


def inflate_stream(stream: bytes) -> bytes:
    try:
        return zlib.decompress(stream)
    except zlib.error:
        return stream


def parse_objects(payload: bytes) -> dict[int, bytes]:
    return {int(match.group(1)): match.group(3) for match in _OBJECT_PATTERN.finditer(payload)}


def extract_stream(body: bytes) -> bytes | None:
    stream_match = _STREAM_PATTERN.search(body)
    if stream_match is None:
        return None
    return inflate_stream(stream_match.group(1))


def is_page_object(body: bytes) -> bool:
    return _PAGE_PATTERN.search(body) is not None


def find_contents_object_id(page_body: bytes) -> int | None:
    contents_match = _CONTENTS_PATTERN.search(page_body)
    if contents_match is None:
        return None
    return int(contents_match.group(1))


def iter_raw_streams(payload: bytes) -> list[bytes]:
    return [inflate_stream(stream) for stream in _STREAM_PATTERN.findall(payload)]


def parse_tounicode_map(stream: bytes) -> dict[str, str]:
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


def build_font_maps(objects: dict[int, bytes], page_body: bytes) -> dict[str, dict[str, str]]:
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
        cmap_stream = extract_stream(cmap_body)
        if cmap_stream is None:
            continue
        font_maps[font_name.decode("ascii")] = parse_tounicode_map(cmap_stream)
    return font_maps
