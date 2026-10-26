"""Reference integrity for the OLL guides in 06-Rubik.

Ground truth is `oll-algorithms.pdf` (Zemdegs / Klise), captured once into
`tests/fixtures/oll_cases.json`: for every OLL case, its case name, its standard
OLL number, and the 21-character signature of its diagram.

The guides are then checked against that ground truth. Nothing here trusts the
`friedrich-oll-NN.png` numbering: the file that shows a case is identified from
the artwork, which is the only way to catch a guide that points at the wrong
picture while *looking* consistent.
"""

from __future__ import annotations

import itertools
import re
import sys
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

PROJECT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT))

from tools.oll_refs import (  # noqa: E402
    HTML_FILES,
    HTML_FACE,
    ROW_RE,
    audit,
    build_mapping,
    declared_oll,
    group_problems,
    image_files,
    load_cases,
)
from tools.pdf_ground_truth import extract_groups  # noqa: E402
from tools.signature import signature  # noqa: E402

GUIDES = list(HTML_FILES)
MAPPING_FIXTURE = PROJECT / "tests" / "fixtures" / "file_to_case.json"

# A rendered side sticker is roughly 5x15 px. The art this replaced differed by
# at most 176 px between two *different* cases, confined to a 1px sliver, which
# is why Sune and Anti-Sune looked identical on screen.
MIN_VISIBLE_DIFFERENCE = 250

# Case name -> standard OLL number, read straight out of the PDF's labels.
# Kept as literals so a break in the PDF parser cannot silently redefine truth.
KNOWN_CASES = {
    "O1": 1, "O2": 2, "O3": 3, "O4": 4, "O5": 17, "O6": 18, "O7": 19, "O8": 20,
    "S1": 5, "S2": 6, "T1": 33, "T2": 45, "E1": 28, "E2": 57, "F1": 9, "F2": 10,
    "F3": 35, "F4": 37, "K1": 13, "K2": 14, "K3": 15, "K4": 16, "L1": 47,
    "L2": 48, "A1": 29, "A2": 30, "P1": 31, "P2": 32, "I1": 51, "I2": 52,
    "I3": 55, "I4": 56, "B1": 7, "B2": 8, "W1": 36, "W2": 38, "C1": 34,
    "C2": 46, "OCLL1": 21, "OCLL2": 22, "OCLL3": 23, "OCLL4": 24, "OCLL5": 25,
    "OCLL6": 26, "OCLL7": 27,
}


@pytest.fixture(scope="session")
def cases() -> dict[int, dict]:
    return load_cases()


@pytest.fixture(scope="session")
def mapping(cases: dict[int, dict]) -> dict[int, int]:
    return build_mapping(cases)


@pytest.fixture(scope="session")
def pdf_groups() -> list[tuple[str, list[int]]]:
    """The PDF's group headings and the OLL numbers under each, in printed order."""
    return extract_groups()


def rows_of(guide: str) -> list[tuple[int, int]]:
    """(declared OLL, referenced file number) for each row of a guide."""
    rows = []
    for row in ROW_RE.finditer((PROJECT / guide).read_text()):
        oll = declared_oll(row["code"])
        assert oll is not None, f"{guide}: unreadable case code {row['code']!r}"
        rows.append((oll, int(row["file"].split("-")[-1])))
    return rows


def cells_of(file_number: int) -> str:
    path = PROJECT / "img" / f"friedrich-oll-{file_number:02d}.png"
    return signature(Image.open(path), HTML_FACE)[:9]


# --- ground truth -----------------------------------------------------------


def test_fixture_covers_every_oll_case(cases):
    assert len(cases) == 57
    assert sorted(cases) == list(range(1, 58))


@pytest.mark.parametrize("name,oll", sorted(KNOWN_CASES.items()))
def test_pdf_case_names_carry_the_known_oll_number(cases, name, oll):
    assert cases[oll]["name"] == name


# --- the art -> case mapping ------------------------------------------------


def test_every_image_is_used_and_every_case_has_an_image(mapping):
    """57 files, 57 cases, one to one: nothing missing, nothing spare."""
    files = image_files()
    assert len(files) == 57
    assert sorted(mapping) == sorted(files)
    assert sorted(mapping.values()) == list(range(1, 58))


def test_only_the_dot_cases_have_a_single_yellow_cell(mapping):
    dots = sorted(f for f in mapping if cells_of(f).count("Y") == 1)
    assert [mapping[f] for f in dots] == [1, 2]


def test_the_two_square_cases_are_s1_and_s2(mapping):
    """S1 (5) and S2 (6) are the only cases whose face is a bare 2x2 block."""
    def is_square(cells: str) -> bool:
        grid = [[cells[r * 3 + c] == "Y" for c in range(3)] for r in range(3)]
        return (
            cells.count("Y") == 4
            and any(
                all(grid[r + dr][c + dc] for dr in (0, 1) for dc in (0, 1))
                for r in (0, 1) for c in (0, 1)
            )
        )

    squares = sorted(mapping[f] for f in mapping if is_square(cells_of(f)))
    assert squares == [5, 6]


def test_mapping_matches_the_recorded_fixture(mapping):
    recorded = {int(file): oll for file, oll in
                __import__("json").loads(MAPPING_FIXTURE.read_text()).items()}
    assert mapping == recorded


# --- the artwork ------------------------------------------------------------


def test_every_diagram_draws_its_case_exactly(mapping, cases):
    """Not merely the same case up to rotation: the same picture as the PDF."""
    wrong = [
        number for number, oll in mapping.items()
        if signature(Image.open(PROJECT / "img" / f"friedrich-oll-{number:02d}.png"), HTML_FACE)
        != cases[oll]["signature"]
    ]
    assert wrong == []


def test_no_two_diagrams_look_the_same(mapping):
    """Cases that differ only in edge orientation must still look different."""
    pixels = {
        number: np.asarray(
            Image.open(PROJECT / "img" / f"friedrich-oll-{number:02d}.png").convert("RGB")
        ).astype(int)
        for number in mapping
    }
    twins = []
    for (a, b) in itertools.combinations(sorted(pixels), 2):
        differing = int((np.abs(pixels[a] - pixels[b]).sum(axis=2) > 30).sum())
        if differing < MIN_VISIBLE_DIFFERENCE:
            twins.append((a, b, differing))
    assert twins == [], f"indistinguishable pairs: {twins}"


# --- the guides -------------------------------------------------------------


def test_guides_share_one_row_order():
    """One mapping repairs all three guides only if they share a row order."""
    orders = {g: [oll for oll, _ in rows_of(g)] for g in GUIDES}
    first = orders[GUIDES[0]]
    for guide in GUIDES[1:]:
        assert orders[guide] == first, f"{guide} has a different row order"


@pytest.mark.parametrize("guide", GUIDES)
def test_guides_follow_the_pdf_grouping(guide, pdf_groups):
    """Each guide groups and orders the cases as the reference PDF prints them."""
    assert group_problems(PROJECT / guide, pdf_groups) == []


@pytest.mark.parametrize("guide", GUIDES)
def test_every_reference_resolves(guide):
    missing = [
        src for src in re.findall(r'src="(img/[^"]+)"', (PROJECT / guide).read_text())
        if not (PROJECT / src).exists()
    ]
    assert missing == []


@pytest.mark.parametrize("guide", GUIDES)
def test_each_row_shows_the_case_it_declares(guide, mapping):
    wrong = [
        f"OLL {oll} -> img/friedrich-oll-{number:02d}.png (shows OLL {mapping[number]})"
        for oll, number in rows_of(guide)
        if mapping[number] != oll
    ]
    assert wrong == [], (
        f"{len(wrong)} wrong image(s) in {guide}; e.g. {wrong[:5]}"
    )


@pytest.mark.parametrize("guide", GUIDES)
def test_each_guide_covers_all_cases_and_images_once(guide):
    rows = rows_of(guide)
    assert sorted(oll for oll, _ in rows) == list(range(1, 58))
    assert sorted(number for _, number in rows) == list(range(1, 58))


@pytest.mark.parametrize("guide", GUIDES)
def test_audit_reports_no_problems(guide, mapping):
    assert audit(PROJECT / guide, mapping) == []
