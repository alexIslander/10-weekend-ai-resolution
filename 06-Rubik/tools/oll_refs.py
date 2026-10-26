"""Check and repair the image references in the 06-Rubik OLL guides.

The three HTML guides share one row order (26, 27, 21, 22, ... — the reference
PDF's presentation order) and one `img/` folder, so a single file-number ->
OLL-case mapping repairs all of them.

The mapping is not the obvious one: `friedrich-oll-NN.png` is *not* OLL case NN
(the art was exported in a different order, with many cases in mirror order).
It is recovered from the artwork itself, by reading each diagram's 21-character
signature and matching it against the signatures extracted from the PDF.

Usage:

    .venv/bin/python -m tools.oll_refs --check      # report, exit 1 if broken
    .venv/bin/python -m tools.oll_refs --write      # rewrite the references
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

from PIL import Image

from .signature import Face, rotations, signature

PROJECT = Path(__file__).resolve().parent.parent
IMG_DIR = PROJECT / "img"
FIXTURE = PROJECT / "tests" / "fixtures" / "oll_cases.json"
HTML_FILES = (
    "oll-full-guide.html",
    "minimal-without-flows.html",
    "minimal_oll_solution_flows_transition_guide.html",
)

# Redrawn diagrams share one template: 70px 3x3 block from (6,6) in an 82x82 png,
# with a 6px side-sticker band around it.
HTML_FACE = Face(6, 6, 76, 76)

# One table cell: the diagram, its alt text, and the case labels beside it.
ROW_RE = re.compile(
    r'<img src="img/(?P<file>friedrich-oll-\d+)\.png"(?P<attrs>[^>]*)>'
    r'(?P<middle>.*?)case-code">(?P<code>[^<]*)<',
    re.S,
)
DECLARED_RE = re.compile(r"\bOLL\s*(\d+)")   # "OCLL6 / OLL 26" -> 26, not 6


class MappingError(RuntimeError):
    pass


def load_cases(path: Path = FIXTURE) -> dict[int, dict]:
    return {case["oll"]: case for case in json.loads(path.read_text())}


def image_files(img_dir: Path = IMG_DIR) -> dict[int, Path]:
    files = {}
    for path in sorted(img_dir.glob("friedrich-oll-*.png")):
        number = int(re.search(r"oll-(\d+)", path.name).group(1))
        files[number] = path
    return files


def build_mapping(cases: dict[int, dict], img_dir: Path = IMG_DIR) -> dict[int, int]:
    """Return {file number: OLL case number}, recovered from the artwork."""
    by_signature = defaultdict(set)
    for oll, case in cases.items():
        for rotated in rotations(case["signature"]):
            by_signature[rotated].add(oll)

    mapping = {}
    for number, path in image_files(img_dir).items():
        found = by_signature.get(signature(Image.open(path), HTML_FACE), set())
        if len(found) != 1:
            raise MappingError(
                f"img/{path.name}: art matches {sorted(found) or 'no'} case(s); need exactly one"
            )
        mapping[number] = found.pop()

    by_oll = defaultdict(list)
    for number, oll in mapping.items():
        by_oll[oll].append(number)
    duplicated = {oll: files for oll, files in by_oll.items() if len(files) > 1}
    missing = sorted(set(cases) - set(by_oll))
    if duplicated or missing:
        raise MappingError(f"not a bijection — duplicated: {duplicated}, unmapped cases: {missing}")
    return mapping


def expected_file(oll: int, mapping: dict[int, int]) -> str:
    inverse = {case: number for number, case in mapping.items()}
    return f"img/friedrich-oll-{inverse[oll]:02d}.png"


def declared_oll(code: str) -> int | None:
    match = DECLARED_RE.search(code)
    return int(match.group(1)) if match else None


def audit(html_path: Path, mapping: dict[int, int]) -> list[str]:
    """Return one line per problem found in the given guide."""
    text = html_path.read_text()
    problems = []
    seen_cases = []
    seen_files = []
    for row in ROW_RE.finditer(text):
        oll = declared_oll(row["code"])
        if oll is None:
            problems.append(f"{html_path.name}: row with unreadable case code {row['code']!r}")
            continue
        seen_cases.append(oll)
        seen_files.append(int(row["file"].split("-")[-1]))
        want = expected_file(oll, mapping)
        if f"img/{row['file']}.png" != want:
            problems.append(
                f"{html_path.name}: OLL {oll:2d} points at img/{row['file']}.png, should be {want}"
            )
    if sorted(seen_cases) != sorted(set(seen_cases)):
        problems.append(f"{html_path.name}: a case appears more than once")
    if sorted(seen_cases) != sorted(mapping.values()):
        problems.append(f"{html_path.name}: cases covered != 1..57")
    if sorted(seen_files) != sorted(set(seen_files)):
        problems.append(f"{html_path.name}: an image is referenced more than once")
    return problems


def repaired(text: str, mapping: dict[int, int]) -> str:
    def replace(row: re.Match) -> str:
        oll = declared_oll(row["code"])
        if oll is None:
            return row.group(0)
        fixed = expected_file(oll, mapping)
        return row.group(0).replace(f"img/{row['file']}.png", fixed, 1)

    return ROW_RE.sub(replace, text)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="report problems (the default)")
    parser.add_argument("--write", action="store_true", help="rewrite the HTML references")
    parser.add_argument("--mapping", action="store_true", help="print the recovered mapping")
    args = parser.parse_args(argv)

    cases = load_cases()
    mapping = build_mapping(cases)

    if args.mapping:
        for number in sorted(mapping):
            oll = mapping[number]
            print(f"img/friedrich-oll-{number:02d}.png -> OLL {oll:2d} ({cases[oll]['name']})")

    problems = []
    for name in HTML_FILES:
        path = PROJECT / name
        found = audit(path, mapping)
        if args.write and found:
            path.write_text(repaired(path.read_text(), mapping))
            print(f"{name}: rewrote {len(found)} reference(s)")
            found = audit(path, mapping)
        problems.extend(found)

    for problem in problems:
        print(problem)
    print(f"\n{len(problems)} problem(s)")
    return 1 if problems else 0


if __name__ == "__main__":
    raise SystemExit(main())
