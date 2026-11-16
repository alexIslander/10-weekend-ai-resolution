"""Colour-code each guide's step column by the first trigger the case needs.

Every case row's step cell is tagged with the trigger it starts with — S, AS, ET
or WT — and the tag drives one CSS custom property per trigger:

    <td class="seq" data-tool="et">U2 -> ET -> S -> S -> SOLVED</td>

    :root { --tool-et: #5cb85c; }
    td[data-tool="et"] { background: color-mix(in srgb, var(--tool-et) 25%, #fff); }

So the palette is a parameter: change `--tool-*` in the style block, or use the
colour pickers in the toolbox, and every row that opens with that trigger
follows. The tag is derived from the step text, not hand-written, so an edited
flow cannot silently keep the old colour.

Usage:

    .venv/bin/python -m tools.step_tools --write   # add/repair the tags
    .venv/bin/python -m tools.step_tools --check   # report wrong/missing tags
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

from .oll_refs import HTML_FILES, PROJECT

TOOLS = ("s", "as", "et", "wt")

# The full guide spells the triggers out, in the order they are tested: Sune is
# a suffix of Anti-Sune, so Anti-Sune has to win.
PROSE_TRIGGERS = (
    ("anti-sune", "as"),
    ("sune", "s"),
    ("edge trigger", "et"),
    ("wide trigger", "wt"),
)

CELL_RE = re.compile(
    r'<td class="(?P<kind>flow-text|seq)"'
    r'(?P<attrs>[^>]*)>(?P<text>.*?)</td>',
    re.S,
)
TAG_RE = re.compile(r'\s*data-tool="[^"]*"')
STEP_SPLIT = re.compile(r"\s*(?:&rarr;|→)\s*")


def first_tool(kind: str, cell_html: str) -> str | None:
    """The trigger the case starts with: setup turns are skipped."""
    text = re.sub(r"<[^>]+>", " ", cell_html)
    for step in STEP_SPLIT.split(text):
        step = re.sub(r"\s+", " ", step).strip().lower()
        if kind == "flow-text":
            for needle, tool in PROSE_TRIGGERS:
                if step.startswith(needle):
                    return tool
        elif step in TOOLS:
            return step
    return None


def audit(html_path: Path) -> list[str]:
    """Return one line per cell whose tag is missing or disagrees with its text."""
    problems = []
    for cell in CELL_RE.finditer(html_path.read_text()):
        expected = first_tool(cell["kind"], cell["text"])
        tagged = re.search(r'data-tool="(?P<tool>[^"]*)"', cell["attrs"])
        step = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", cell["text"])).strip()
        if expected is None:
            problems.append(f"{html_path.name}: no trigger in {step!r}")
        elif tagged is None:
            problems.append(f"{html_path.name}: {step[:40]!r} starts with {expected}, untagged")
        elif tagged["tool"] != expected:
            problems.append(
                f"{html_path.name}: {step[:40]!r} starts with {expected}, "
                f"tagged {tagged['tool']!r}"
            )
    return problems


def tagged(html_path: Path) -> str:
    """The guide's HTML with every step cell tagged by its first trigger."""

    def replace(cell: re.Match) -> str:
        tool = first_tool(cell["kind"], cell["text"])
        attrs = TAG_RE.sub("", cell["attrs"])
        if tool:
            attrs += f' data-tool="{tool}"'
        return f'<td class="{cell["kind"]}"{attrs}>{cell["text"]}</td>'

    return CELL_RE.sub(replace, html_path.read_text())


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="report problems (the default)")
    parser.add_argument("--write", action="store_true", help="rewrite the step cells")
    args = parser.parse_args(argv)

    problems = []
    for name in HTML_FILES:
        path = PROJECT / name
        found = audit(path)
        if args.write and found:
            path.write_text(tagged(path))
            print(f"{name}: tagged {len(found)} step cell(s)")
            found = audit(path)
        problems.extend(found)

    for problem in problems:
        print(problem)
    print(f"\n{len(problems)} problem(s)")
    return 1 if problems else 0


if __name__ == "__main__":
    raise SystemExit(main())
