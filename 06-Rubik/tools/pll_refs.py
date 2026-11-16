"""The PLL reference: parse the saved source page, then build the guides.

`source/CFOP PLL_ Permutáld a Legultolsó Lapot.html` (rubikkocka.com) is the
reference for PLL: the last-layer permutation cases, each printed as a diagram
plus a named algorithm — A1, A2, U1, U2, H, T, J1, J2, R1, R2, V, G1-G4, F,
Z, Y, N1, N2, E, 21 in all. The page is a saved snapshot, so it is parsed once
rather than re-fetched:

    <div class="algDescr">
      <div class="algImgCont"><img src=".../friedrich-pll-07.png"></div>
      <div><span class="algName">U 1:</span> R2 U [R U R' U'] (R' U') (R' U R')</div>
    </div>

The pair (image, algorithm) is the ground truth; `tests/fixtures/pll_cases.json`
records it in source order, and `img/pll-*.png` are copied from the snapshot so
the published page never depends on the source folder.

Each case links to the cube simulator with the *inverse* of its algorithm as the
setup, so the simulator opens on that case and the algorithm solves it.

Usage:

    .venv/bin/python -m tools.pll_refs --write   # fixture + images
    .venv/bin/python -m tools.pll_refs --build   # pll-guide.html + print page
    .venv/bin/python -m tools.pll_refs --check   # report, exit 1 if drifted
"""

from __future__ import annotations

import argparse
import html
import json
import re
import shutil
import sys
from pathlib import Path
from urllib.parse import quote

from .cube import (
    apply_alg,
    inverse_alg,
    is_solved,
    last_layer_on_top,
    normalising_rotations,
    solved,
)
from .oll_refs import PROJECT

SOURCE = PROJECT / "source" / "CFOP PLL_ Permutáld a Legultolsó Lapot.html"
SOURCE_IMG = PROJECT / "source" / "CFOP PLL_ Permutáld a Legultolsó Lapot_files"
FIXTURE = PROJECT / "tests" / "fixtures" / "pll_cases.json"
IMG_DIR = PROJECT / "img"
GUIDE = PROJECT / "pll-guide.html"
PRINT_GUIDE = PROJECT / "pll-guide-print.html"

# The four formulas that cover the minimal route, in the order to learn them.
MINIMAL = ("A1", "U1", "H", "T")
MINIMAL_NOTE = {
    "A1": "corner 3-cycle",
    "U1": "edge 3-cycle",
    "H": "opposite edges swap",
    "T": "two corners + two edges",
}

PAIR_RE = re.compile(
    r'<img[^>]*friedrich-pll-(?P<number>\d+)\.png[^>]*>'
    r'(?P<body>.*?)<span class="algName">(?P<name>[^<]+)</span>\s*(?P<alg>[^<]+?)</div>',
    re.S,
)

def normalise_name(raw: str) -> str:
    """The reference's label without spaces or colon: A 1 -> A1, H: -> H."""
    return re.sub(r"\s+", "", raw.replace(":", ""))


def slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", name.lower())


def simulator_link(alg: str) -> tuple[str, str, str]:
    """(setup, alg, kind) for the simulator, checked against the cube model.

    The useful link opens on the case and runs the algorithm from it
    (`kind="case"`). Twenty of the twenty-one algorithms are written so that the
    inverse reproduces the case with the last layer on top; for the three that
    are written with a whole-cube rotation (A1, A2, E) the inverse is not that
    case, so the link instead runs the algorithm from a solved cube
    (`kind="run"`), which is what the reference page's own viewer does.
    """
    setup = inverse_alg(alg)
    cube = apply_alg(solved(), setup)
    if last_layer_on_top(cube) and is_solved(apply_alg(cube, alg)):
        return setup, alg, "case"
    return "", alg, "run"


def simulator_url(alg: str) -> str:
    setup, turns, _kind = simulator_link(alg)
    query = f"puzzle=3x3x3&setup={quote(setup, safe='')}"
    return f"https://alg.cubing.net/?{query}&alg={quote(turns, safe='')}&type=alg"


def extract_cases(source: Path = SOURCE) -> list[dict]:
    """The 21 PLL cases, in the order the reference page prints them."""
    text = source.read_text(encoding="utf-8", errors="replace")
    cases = []
    for match in PAIR_RE.finditer(text):
        name = normalise_name(match["name"])
        cases.append(
            {
                "name": name,
                "alg": re.sub(r"\s+", " ", match["alg"]).strip(),
                "image": f"friedrich-pll-{int(match['number']):02d}.png",
            }
        )
    return cases


def check_cases(cases: list[dict]) -> list[str]:
    problems = []
    names = [case["name"] for case in cases]
    if len(names) != 21:
        problems.append(f"expected 21 PLL cases, parsed {len(names)}: {names}")
    if len(set(names)) != len(names):
        problems.append(f"duplicate case names: {names}")
    if set(MINIMAL) - set(names):
        problems.append(f"minimal formulas missing from the reference: {set(MINIMAL) - set(names)}")
    if len({case["image"] for case in cases}) != len(cases):
        problems.append("an image is used for more than one case")
    return problems


def write_fixture(cases: list[dict], path: Path = FIXTURE) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(cases, indent=1) + "\n")


def copy_images(cases: list[dict]) -> int:
    copied = 0
    for case in cases:
        target = IMG_DIR / f"pll-{slug(case['name'])}.png"
        source = SOURCE_IMG / case["image"]
        if not target.exists() or target.read_bytes() != source.read_bytes():
            shutil.copyfile(source, target)
            copied += 1
    return copied


def load_cases(path: Path = FIXTURE) -> list[dict]:
    return json.loads(path.read_text())


def case_cell(case: dict, tag_minimal: bool = True, show_code: bool = True) -> str:
    badge = (
        '<span class="minimal-tag">minimal</span>'
        if tag_minimal and case["name"] in MINIMAL
        else ""
    )
    code = '<span class="case-code">PLL</span>' if show_code else ""
    image = f"img/pll-{slug(case['name'])}.png"
    return (
        '<div class="case-cell">'
        f'<a href="{simulator_url(case["alg"])}" target="_blank" rel="noopener" '
        'title="Open this position in the cube simulator">'
        f'<img src="{image}" alt="PLL {case["name"]}"></a>'
        '<div class="case-info">'
        f'<span class="case-title">{case["name"]}</span>'
        f"{code}{badge}"
        "</div></div>"
    )


def link_title(alg: str) -> str:
    kind = simulator_link(alg)[2]
    return (
        "Open this position in the cube simulator"
        if kind == "case"
        else "Run this algorithm in the cube simulator from a solved cube"
    )


def minimal_panel(cases: list[dict], heading: str, link: str | None) -> str:
    by_name = {case["name"]: case for case in cases}
    items = []
    for name in MINIMAL:
        case = by_name[name]
        items.append(
            f'<li><strong>{name}</strong> ({MINIMAL_NOTE[name]}): '
            f'<span class="alg">{html.escape(case["alg"], quote=False)}</span></li>'
        )
    footer = (
        f'<p>All 21 cases: <a href="./{link}">PLL guide</a>.</p>' if link else ""
    )
    return (
        '<div class="toolbox pll-box">'
        f"<strong>{heading}</strong>"
        f'<ul>{"".join(items)}</ul>{footer}'
        "</div>"
    )


PAGE_STYLE = """    <style>
        body { font-family: Arial, sans-serif; margin: 30px; color: #222; line-height: 1.5; background: #fafafa; }
        h1 { color: #111; border-bottom: 3px solid #333; padding-bottom: 8px; }
        h2 { color: #222; border-bottom: 2px solid #ccc; padding-bottom: 5px; margin-top: 40px; }
        p { color: #555; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 30px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; vertical-align: middle; }
        th { background-color: #f0f0f0; font-weight: bold; }
        .case-cell { display: flex; align-items: center; gap: 12px; }
        .case-cell img { width: 48px; height: 48px; object-fit: contain; }
        .case-cell a { display: inline-flex; }
        .case-cell img { cursor: zoom-in; border-radius: 4px; position: relative; z-index: 1;
            transition: transform .15s ease-out, box-shadow .15s ease-out; }
        .case-cell img:hover { transform: scale(2.5); z-index: 30; background: #fff;
            box-shadow: 0 6px 18px rgba(0,0,0,.25); }
        .case-info { display: flex; flex-direction: column; }
        .case-title { font-weight: bold; font-size: 14px; color: #111; }
        .case-code { font-size: 11px; color: #666; }
        .minimal-tag { font-size: 10px; color: #6c3483; text-transform: uppercase;
            letter-spacing: .5px; }
        .toolbox { background: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin-bottom: 30px; }
        .toolbox ul { margin: 5px 0 0 20px; padding: 0; }
        .pll-box { border-left-color: #8e44ad; }
        .alg { font-family: "Courier New", monospace; font-size: 13px; color: #333; }
        td.formula { font-family: "Courier New", monospace; font-size: 13px; color: #333; }
    </style>"""


def build_guide(cases: list[dict]) -> str:
    rows = "\n".join(
        '        <tr>\n'
        f'            <td>{case_cell(case)}</td>\n'
        f'            <td class="formula">{html.escape(case["alg"], quote=False)}</td>\n'
        "        </tr>"
        for case in cases
    )
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>PLL Reference — 21 Cases</title>
{PAGE_STYLE}
</head>
<body>

    <h1>PLL Reference — 21 Cases</h1>
    <p>Permutation of the Last Layer, after OLL has oriented the yellow face. The
    cases and algorithms are those of the reference page
    (rubikkocka.com, after Ruwix); clicking a diagram opens that exact position
    in the cube simulator, with the algorithm preloaded.</p>

{minimal_panel(cases, "0. Minimal PLL formulas", None)}

    <table>
        <tr><th>Case</th><th>Formula</th></tr>
{rows}
    </table>

    <p><a href="./index.html">Back to the guides</a> · <a href="./pll-guide-print.html">Print version</a></p>

</body>
</html>
"""


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true", help="write the fixture and copy the images")
    parser.add_argument("--build", action="store_true", help="write pll-guide.html")
    parser.add_argument("--check", action="store_true", help="report problems (the default)")
    args = parser.parse_args(argv)

    cases = extract_cases()
    problems = check_cases(cases)

    if args.write:
        write_fixture(cases)
        copied = copy_images(cases)
        print(f"wrote {FIXTURE.name} with {len(cases)} cases, copied {copied} image(s)")

    if args.build:
        GUIDE.write_text(build_guide(cases))
        print(f"wrote {GUIDE.name}")

    if problems:
        for problem in problems:
            print(problem, file=sys.stderr)
        return 1
    print(f"{len(cases)} PLL cases parsed, 0 problem(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
