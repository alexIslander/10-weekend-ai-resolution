"""The print pages: generated from the online guides, two cases per line.

Print is a different layout, not a different document: same cases, same
formulas, same routes. These tests hold the generated pages to that, and fail if
someone hand-edits a print page instead of the guide it comes from.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

import pytest

PROJECT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT))

from tools import pll_refs, print_guides  # noqa: E402
from tools.ref_algs import load_algs  # noqa: E402

OLL_PAGES = list(print_guides.OLL_PRINTS.values())
PLL_PAGE = print_guides.PLL_PRINT
CASE_RE = re.compile(r'<table class="case">.*?</table>', re.S)
PAIR_RE = re.compile(r'<div class="pair">(?P<body>.*?)</div>', re.S)
MINIMAL_RE = re.compile(r'<div class="minimal(?: pll)?">')


@pytest.fixture(scope="session")
def pages() -> dict[str, str]:
    built = print_guides.build_all()
    return {name: built[name] for name in pages_order()}


def pages_order() -> list[str]:
    return [*OLL_PAGES, PLL_PAGE]


def test_the_print_pages_are_what_the_guides_generate(pages):
    for name, content in pages.items():
        path = PROJECT / name
        assert path.exists(), f"{name}: run `python -m tools.print_guides --build`"
        assert path.read_text() == content, f"{name} has been hand-edited"


@pytest.mark.parametrize("page", OLL_PAGES)
def test_each_oll_print_page_covers_all_57_cases(page, pages):
    text = pages[page]
    assert len(CASE_RE.findall(text)) == 57
    assert len(re.findall(r'<img src="img/friedrich-oll-\d+\.png"', text)) == 57


def test_the_pll_print_page_covers_all_21_cases(pages):
    text = pages[PLL_PAGE]
    assert len(CASE_RE.findall(text)) == 21
    assert len(re.findall(r'<img src="img/pll-[^"]+\.png"', text)) == 21


@pytest.mark.parametrize("page", pages_order())
def test_two_cases_per_line_and_none_lost(page, pages):
    """Reference-PDF layout: a pair holds at most two cases, and groups stay intact."""
    for pair in PAIR_RE.finditer(pages[page]):
        assert len(CASE_RE.findall(pair["body"])) <= 2
        assert len(pair["body"].split('<table class="case">')) - 1 <= 2


@pytest.mark.parametrize("page", pages_order())
def test_every_print_page_opens_with_the_two_minimal_blocks_side_by_side(page, pages):
    text = pages[page]
    panels = MINIMAL_RE.findall(text)
    assert len(panels) == 2, f"{page}: expected both minimal blocks, found {len(panels)}"
    assert "0. Minimal" in text
    assert "1. Minimal PLL formulas" in text
    # side by side, not stacked: both panels sit in one grid row before the cases
    row = text.split('<div class="minimal-row">', 1)[1].split('</div>\n\n', 1)[0]
    assert row.count('class="minimal') == 2


@pytest.mark.parametrize("page", pages_order())
def test_the_index_is_dropped_from_print(page, pages):
    assert "Index (the reference PDF's groups" not in pages[page]
    assert 'select a group' not in pages[page].lower()


@pytest.mark.parametrize("page", OLL_PAGES)
def test_each_row_keeps_its_reference_formula(page, pages):
    """The printed formula is the PDF's, matched to the case it belongs to."""
    text = pages[page]
    algs = load_algs()
    blocks = CASE_RE.findall(text)
    found = {}
    for block in blocks:
        code = re.search(r"OLL (\d+)", block)
        assert code, block[:120]
        found[int(code.group(1))] = True
        assert algs[int(code.group(1))] in block, f"OLL {code.group(1)} lost its formula"
    assert sorted(found) == list(range(1, 58))


@pytest.mark.parametrize("page", OLL_PAGES)
def test_flow_and_steps_share_one_column(page, pages):
    """Merged to save space: the route cell ends with the step count."""
    for block in CASE_RE.findall(pages[page]):
        route = re.search(r'<td class="route"[^>]*>.*?</td>', block, re.S)
        assert route, block[:120]
        assert re.search(r"\(\d+ Steps?\)</span>", route.group(0))


def test_the_pll_print_page_prints_every_formula(pages):
    text = pages[PLL_PAGE]
    for case in pll_refs.load_cases():
        assert case["alg"] in text, f"{case['name']} lost its formula"
    for name in pll_refs.MINIMAL:
        assert f"<strong>{name}</strong>" in text
