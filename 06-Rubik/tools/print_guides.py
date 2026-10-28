"""Build the print versions of the guides.

Each online guide is one case per row, which is right on screen and wasteful on
paper. The print version reflows the *same* rows into the reference PDF's
layout: two cases per line, each case a compact block of

    [diagram + case name] [reference formula] [flow, with its step count]

The two minimal-formula blocks (OLL toolbox and the four PLL formulas) open the
document side by side instead of stacked, and the index is dropped: on paper you
sort by diagram, not by anchor link.

The print pages are generated from the online ones, never hand-edited, so the
two can never disagree about a case, a formula or a route:

    .venv/bin/python -m tools.print_guides --build   # write the three pages
    .venv/bin/python -m tools.print_guides --check    # report drift, exit 1
"""

from __future__ import annotations

import argparse
import html
import re
import sys
from pathlib import Path

from . import pll_refs
from .oll_refs import PROJECT

OLL_PRINTS = {
    "oll-full-guide.html": "oll-full-guide-print.html",
    "minimal-without-flows.html": "minimal-without-flows-print.html",
}
PLL_GUIDE = pll_refs.GUIDE.name
PLL_PRINT = pll_refs.PRINT_GUIDE.name

SECTION_RE = re.compile(
    r'<h2 id="(?P<id>[^"]+)">(?P<title>[^<]*)</h2>\s*<table>(?P<table>.*?)</table>', re.S
)
ROW_RE = re.compile(r"<tr>(?P<body>.*?)</tr>", re.S)
CASE_CELL_RE = re.compile(r'(?P<cell><div class="case-cell">.*?</div></div>)', re.S)
FLOW_RE = re.compile(
    r'<td class="(?P<kind>flow-text|seq)"(?: data-tool="(?P<tool>[^"]*)")?>(?P<html>.*?)</td>',
    re.S,
)
ALG_RE = re.compile(r'<td class="(?:ref-alg|formula)">(?P<alg>[^<]*)</td>')
STEPS_RE = re.compile(r"<td>(?P<steps>\d+ Steps?)</td>")
PART_PREFIX = re.compile(r"^Part\s+\d+\s*:\s*")
TOOLBOX_RE = re.compile(r'<div class="toolbox[^"]*">(?P<body>.*?)</div>', re.S)
STRONG_RE = re.compile(r"<strong>(?P<title>[^<]*)</strong>")
ITEM_RE = re.compile(r"<li>(?P<item>.*?)</li>", re.S)
INPUT_RE = re.compile(r'<input[^>]*>')
TAG_RE = re.compile(r"<[^>]+>")


class PrintError(RuntimeError):
    pass


def _toolbox(guide: Path) -> tuple[str, list[str]]:
    """The guide's first toolbox: its title and its formula items, minus pickers."""
    match = TOOLBOX_RE.search(guide.read_text())
    if match is None:
        raise PrintError(f"{guide.name}: no toolbox found")
    body = match["body"]
    title = STRONG_RE.search(body)
    items = [
        INPUT_RE.sub("", item).strip()
        for item in ITEM_RE.findall(body)
    ]
    return (title["title"].strip() if title else ""), items


def _minimal_panel(title: str, items: list[str]) -> str:
    return (
        '<div class="minimal">'
        f"<strong>{html.escape(title)}</strong>"
        f'<ul>{"".join(f"<li>{item}</li>" for item in items)}</ul>'
        "</div>"
    )


def _pll_panel() -> list[str]:
    """The four minimal PLL formulas, from the PLL fixture."""
    cases = {case["name"]: case for case in pll_refs.load_cases()}
    items = []
    for name in pll_refs.MINIMAL:
        formula = html.escape(cases[name]["alg"], quote=False)
        items.append(
            f"<strong>{name}</strong> ({pll_refs.MINIMAL_NOTE[name]}): {formula}"
        )
    return items


CASE_STYLE = """        @page { size: A4 portrait; margin: 9mm; }
        body { font-family: Arial, sans-serif; font-size: 9pt; color: #111; margin: 0; }
        h1 { font-size: 14pt; margin: 0 0 2mm; border-bottom: 2px solid #333; padding-bottom: 1mm; }
        h2 { font-size: 10pt; margin: 4mm 0 1.5mm; border-bottom: 1px solid #999; }
        .minimal-row { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; margin-bottom: 3mm; }
        .minimal { border: 1px solid #bbb; border-left: 3px solid #007bff; padding: 1.5mm 2mm;
            font-size: 8pt; background: #f8f9fa; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .minimal.pll { border-left-color: #8e44ad; }
        .minimal ul { margin: 1mm 0 0 4mm; padding: 0; }
        .minimal li { margin: 0.4mm 0; }
        .minimal strong { font-size: 8.5pt; }
        .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5mm; margin-bottom: 1.5mm;
            break-inside: avoid; page-break-inside: avoid; }
        h2 { break-after: avoid; page-break-after: avoid; }
        .minimal-row { break-inside: avoid; page-break-inside: avoid; }
        table.case { width: 100%; border-collapse: collapse; font-size: 8pt; table-layout: fixed; }
        table.case td { border: 1px solid #ccc; padding: 1mm; vertical-align: middle; }
        table.case .art { width: 22mm; }
        table.case .alg { width: 42%; }
        body.pll table.case .alg { width: auto; font-size: 8.5pt; }
        table.case img { width: 10mm; height: 10mm; object-fit: contain; display: block; }
        table.case .case-info { display: flex; flex-direction: column; }
        table.case .case-title { font-weight: bold; font-size: 8pt; }
        table.case .case-code { font-size: 6.5pt; color: #666; }
        table.case .case-cell { display: flex; align-items: center; gap: 1.5mm; }
        table.case .alg { font-family: "Courier New", monospace; font-size: 7.5pt;
            word-break: break-word; }
        table.case .route { font-size: 7.5pt; }
        table.case .steps { color: #666; font-size: 6.5pt; }
        td[data-tool="s"] { background: color-mix(in srgb, var(--tool-s) 25%, #fff); }
        td[data-tool="as"] { background: color-mix(in srgb, var(--tool-as) 25%, #fff); }
        td[data-tool="et"] { background: color-mix(in srgb, var(--tool-et) 25%, #fff); }
        td[data-tool="wt"] { background: color-mix(in srgb, var(--tool-wt) 25%, #fff); }
        :root { --tool-s: #d9534f; --tool-as: #f0ad4e; --tool-et: #5cb85c; --tool-wt: #4a9fd8; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }"""


def _page(title: str, heading: str, panels: str, sections: str, footer: str,
          body_class: str = "") -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{html.escape(title)} — print</title>
    <style>
{CASE_STYLE}
    </style>
</head>
<body{body_class}>

    <h1>{html.escape(heading)}</h1>
    <div class="minimal-row">
{panels}
    </div>

{sections}

    <p class="footer">{footer}</p>

</body>
</html>
"""


def _case_block(cell: str, alg: str, flow: str | None = None,
                tool: str | None = None, steps: str = "") -> str:
    """One printed case: art, formula, and (OLL only) the route with its step count."""
    route = ""
    if flow is not None:
        tool_attr = f' data-tool="{tool}"' if tool else ""
        route = (
            f'<td class="route"{tool_attr}>{flow} '
            f'<span class="steps">({html.escape(steps)})</span></td>'
        )
    return (
        '            <table class="case"><tr>'
        f'<td class="art">{cell}</td>'
        f'<td class="alg">{alg}</td>'
        f"{route}"
        "</tr></table>"
    )


def _sections(guide: Path) -> str:
    """The guide's case tables, two cases per line, groups kept intact."""
    text = guide.read_text()
    out = []
    for section in SECTION_RE.finditer(text):
        title = PART_PREFIX.sub("", section["title"].strip())
        blocks = []
        for row in ROW_RE.finditer(section["table"]):
            if "<th>" in row["body"]:
                continue   # header row
            cell = CASE_CELL_RE.search(row["body"])
            flow = FLOW_RE.search(row["body"])
            alg = ALG_RE.search(row["body"])
            steps = STEPS_RE.search(row["body"])
            if not (cell and flow and alg and steps):
                raise PrintError(f"{guide.name}: unreadable row in {title}: {row['body'][:80]}")
            blocks.append(
                _case_block(cell["cell"], alg["alg"], flow["html"], flow["tool"], steps["steps"])
            )
        out.append(f'    <h2>{html.escape(title)}</h2>')
        for start in range(0, len(blocks), 2):
            pair = blocks[start:start + 2]
            out.append('    <div class="pair">')
            out.extend(pair)
            if len(pair) == 1:
                out.append('            <span></span>')
            out.append("    </div>")
    return "\n".join(out)


def build_oll_print(guide_name: str) -> str:
    guide = PROJECT / guide_name
    title, items = _toolbox(guide)
    panels = "\n".join(
        (
            _minimal_panel(title, items),
            _minimal_panel("1. Minimal PLL formulas", _pll_panel()).replace(
                'class="minimal"', 'class="minimal pll"'
            ),
        )
    )
    heading = re.search(r"<h1>(?P<t>[^<]*)</h1>", guide.read_text())["t"]
    return _page(
        heading,
        heading,
        panels,
        _sections(guide),
        f"Generated from {guide_name}. Reference formulas: OLL (Zemdegs / Klise), PLL (rubikkocka.com).",
    )


def build_pll_print() -> str:
    cases = pll_refs.load_cases()
    by_name = {case["name"]: case for case in cases}
    minimal = [by_name[name] for name in pll_refs.MINIMAL]
    full = [case for case in cases if case["name"] not in pll_refs.MINIMAL]

    def blocks(group: list[dict]) -> str:
        made = [
            _case_block(
                pll_refs.case_cell(case, tag_minimal=False, show_code=False),
                html.escape(case["alg"], quote=False),
            )
            for case in group
        ]
        out = []
        for start in range(0, len(made), 2):
            pair = made[start:start + 2]
            out.append('    <div class="pair">')
            out.extend(pair)
            if len(pair) == 1:
                out.append("            <span></span>")
            out.append("    </div>")
        return "\n".join(out)

    # PLL rows carry only a formula, so the formula takes the width the route
    # column has in the OLL pages.
    sections = "\n".join(
        (
            "    <h2>Minimal four</h2>",
            blocks(minimal),
            "    <h2>The other 17 cases</h2>",
            blocks(full),
        )
    )
    panels = "\n".join(
        (
            _minimal_panel("0. Minimal OLL formulas", _oll_toolbox_items()),
            _minimal_panel("1. Minimal PLL formulas", _pll_panel()).replace(
                'class="minimal"', 'class="minimal pll"'
            ),
        )
    )
    return _page(
        "PLL Reference — 21 Cases",
        "PLL Reference — 21 Cases",
        panels,
        sections,
        "Generated from pll-guide.html. Cases and formulas: rubikkocka.com (after Ruwix).",
        body_class=' class="pll"',
    )


def _oll_toolbox_items() -> list[str]:
    _, items = _toolbox(PROJECT / "oll-full-guide.html")
    return items


def build_all() -> dict[str, str]:
    pages = {print_name: build_oll_print(guide) for guide, print_name in OLL_PRINTS.items()}
    pages[PLL_PRINT] = build_pll_print()
    return pages


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--build", action="store_true", help="write the print pages")
    parser.add_argument("--check", action="store_true", help="report drift (the default)")
    args = parser.parse_args(argv)

    pages = build_all()
    problems = []
    for name, content in pages.items():
        path = PROJECT / name
        if args.build:
            path.write_text(content)
            print(f"wrote {name} ({len(content.splitlines())} lines)")
            continue
        if not path.exists():
            problems.append(f"{name}: missing")
        elif path.read_text() != content:
            problems.append(f"{name}: differs from what the online guide generates")

    for problem in problems:
        print(problem)
    print(f"{len(problems)} problem(s)")
    return 1 if problems else 0


if __name__ == "__main__":
    raise SystemExit(main())
