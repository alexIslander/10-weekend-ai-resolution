"""Keep the reference-formula column in step with the reference PDF.

Both OLL guides carry the PDF's own one-step formula for every case, in a
column of its own, immediately before the `Steps` column:

    <td class="ref-alg">R U2 R' U' R U' R'</td>

The text is not hand-maintained. It comes from `tests/fixtures/oll_cases.json`,
which `tools/pdf_ground_truth.py` captures from the PDF, so a formula cannot
drift from the reference and a reordered row cannot keep its neighbour's
algorithm. Only the first ("suggested") formula is shown where the PDF prints
an alternative as a second line.

Usage:

    .venv/bin/python -m tools.ref_algs --check   # report, exit 1 if broken
    .venv/bin/python -m tools.ref_algs --write   # rewrite the column
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from .oll_refs import HTML_FILES, PROJECT

FIXTURE = PROJECT / "tests" / "fixtures" / "oll_cases.json"

ROW_RE = re.compile(r"<tr>(?P<body>.*?)</tr>", re.S)
CODE_RE = re.compile(r'case-code">\s*OLL\s*(?P<oll>\d+)\s*<')
STEPS_RE = re.compile(r"<td>(?P<steps>\d+ Steps?)</td>")
REF_RE = re.compile(r'<td class="ref-alg">(?P<alg>[^<]*)</td>')
HEADER_RE = re.compile(r"<th>Steps</th>")
HEADER_CELL = "<th>Reference Formula (PDF)</th>"


def load_algs(path: Path = FIXTURE) -> dict[int, str]:
    """{OLL number: the PDF's suggested formula}."""
    return {case["oll"]: case["alg"] for case in json.loads(path.read_text())}


def _row_problems(name: str, body: str, algs: dict[int, str]) -> tuple[list[str], int | None]:
    """Problems in one `<tr>`, plus the OLL number if it is a case row."""
    code = CODE_RE.search(body)
    if code is None:
        return [], None
    oll = int(code["oll"])
    problems = []
    steps = STEPS_RE.search(body)
    if steps is None:
        return [f"{name}: OLL {oll} has no Steps cell"], oll
    ref = REF_RE.search(body)
    want = algs.get(oll)
    if want is None:
        problems.append(f"{name}: OLL {oll} has no formula in the fixture")
    elif ref is None:
        problems.append(f"{name}: OLL {oll} has no reference-formula column")
    elif ref["alg"] != want:
        problems.append(
            f"{name}: OLL {oll} shows {ref['alg']!r}, PDF has {want!r}"
        )
    if ref is not None and body[ref.end():steps.start()].strip() != "":
        problems.append(f"{name}: OLL {oll} has something between the formula and Steps")
    return problems, oll


def audit(html_path: Path, algs: dict[int, str]) -> list[str]:
    """Return one line per missing, misplaced or stale reference formula."""
    problems = []
    for row in ROW_RE.finditer(html_path.read_text()):
        found, _ = _row_problems(html_path.name, row["body"], algs)
        problems.extend(found)
    return problems


def repaired(text: str, algs: dict[int, str]) -> str:
    """Insert or refresh the reference cell of every case row."""

    def replace(row: re.Match) -> str:
        body = row["body"]
        code = CODE_RE.search(body)
        steps = STEPS_RE.search(body)
        if code is None or steps is None:
            return row.group(0)
        want = algs.get(int(code["oll"]))
        if want is None:
            return row.group(0)
        cell = f'<td class="ref-alg">{want}</td>'
        ref = REF_RE.search(body)
        if ref is None:
            body = body[:steps.start()] + cell + body[steps.start():]
        else:
            body = body[:ref.start()] + cell + body[ref.end():]
        return f"<tr>{body}</tr>"

    text = ROW_RE.sub(replace, text)
    if HEADER_CELL not in text:
        text = HEADER_RE.sub(HEADER_CELL + "<th>Steps</th>", text)
    return text


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="report problems (the default)")
    parser.add_argument("--write", action="store_true", help="rewrite the column")
    args = parser.parse_args(argv)

    algs = load_algs()
    problems = []
    for name in HTML_FILES:
        path = PROJECT / name
        found = audit(path, algs)
        if args.write and found:
            path.write_text(repaired(path.read_text(), algs))
            print(f"{name}: rewrote {len(found)} row(s)")
            found = audit(path, algs)
        problems.extend(found)

    for problem in problems:
        print(problem)
    print(f"\n{len(problems)} problem(s)")
    return 1 if problems else 0


if __name__ == "__main__":
    raise SystemExit(main())
