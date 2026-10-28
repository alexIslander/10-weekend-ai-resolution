"""The PLL reference: source page -> fixture -> guide.

Ground truth is the saved reference page
(`source/CFOP PLL_ Permutáld a Legultolsó Lapot.html`): 21 named cases, each
printed as a diagram beside its algorithm. The fixture records that pairing, and
the guide is checked against it, so a case cannot lose its formula or pick up its
neighbour's diagram.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

import pytest

PROJECT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT))

from tools import cube, pll_refs  # noqa: E402

MINIMAL = pll_refs.MINIMAL


@pytest.fixture(scope="session")
def cases() -> list[dict]:
    return pll_refs.load_cases()


# --- ground truth -----------------------------------------------------------


def test_the_reference_has_the_21_cases():
    parsed = pll_refs.extract_cases()
    assert [case["name"] for case in parsed] == [
        "A1", "A2", "U1", "U2", "H", "T", "J1", "J2", "R1", "R2", "V",
        "G1", "G2", "G3", "G4", "F", "Z", "Y", "N1", "N2", "E",
    ]
    assert pll_refs.check_cases(parsed) == []


def test_fixture_matches_a_fresh_parse(cases):
    assert cases == pll_refs.extract_cases()


def test_the_minimal_four_are_in_the_reference(cases):
    names = {case["name"] for case in cases}
    assert set(MINIMAL) <= names
    for name in MINIMAL:
        assert name in pll_refs.MINIMAL_NOTE


@pytest.mark.parametrize("name,alg", [
    ("A1", "x [(R' U R') D2] [(R U' R') D2] R2"),
    ("U1", "R2 U [R U R' U'] (R' U') (R' U R')"),
    ("H", "M2 U M2 U2 M2 U M2"),
    ("T", "[R U R' U'] [R' F] [R2 U' R'] U' [R U R' F']"),
])
def test_the_minimal_formulas_are_the_ones_the_user_learns(cases, name, alg):
    """Pinned literals: a re-parse of the source must not quietly change them."""
    assert {case["name"]: case["alg"] for case in cases}[name] == alg


# --- the images -------------------------------------------------------------


@pytest.mark.parametrize("case", pll_refs.load_cases(), ids=lambda c: c["name"])
def test_every_case_has_its_picture(case):
    path = PROJECT / "img" / f"pll-{pll_refs.slug(case['name'])}.png"
    assert path.exists(), path
    original = pll_refs.SOURCE_IMG / case["image"]
    assert path.read_bytes() == original.read_bytes(), f"{path.name} drifted from the source art"


# --- the simulator links ----------------------------------------------------


def test_the_cube_model_agrees_with_the_notation():
    """Guards the model the links are proved with, not just the links."""
    assert cube.is_solved(cube.apply_alg(cube.solved(), "R U R' U' " * 6))
    assert cube.apply_alg(cube.solved(), "x") == cube.apply_alg(cube.solved(), "R M' L'")
    assert cube.apply_alg(cube.solved(), "u") == cube.apply_alg(cube.solved(), "U E'")
    assert cube.is_solved(cube.apply_alg(cube.solved(), "x x x x"))


@pytest.mark.parametrize("case", pll_refs.load_cases(), ids=lambda c: c["name"])
def test_each_link_opens_on_its_case_and_solves_it(case):
    setup, alg, kind = pll_refs.simulator_link(case["alg"])
    state = cube.apply_alg(cube.solved(), setup)
    if kind == "case":
        assert cube.last_layer_on_top(state), f"{case['name']}: case is not shown yellow-up"
        assert cube.is_solved(cube.apply_alg(state, alg)), f"{case['name']}: alg does not solve it"
    else:
        # run-style: from solved, the algorithm shows the case without twisting the cube
        assert setup == ""
        ended = cube.apply_alg(state, alg)
        normals = {normal for (_position, normal), colour in ended.items() if colour == "U"}
        assert len(normals) == 1, f"{case['name']}: algorithm does not keep the last layer together"


def test_the_three_rotation_algorithms_run_from_a_solved_cube(cases):
    """A1, A2 and E print a whole-cube rotation, so their inverse is not the case."""
    kinds = {case["name"]: pll_refs.simulator_link(case["alg"])[2] for case in cases}
    assert sorted(name for name, kind in kinds.items() if kind == "run") == ["A1", "A2", "E"]


def test_every_link_is_shareable(cases):
    for case in cases:
        url = pll_refs.simulator_url(case["alg"])
        assert url.startswith("https://alg.cubing.net/?puzzle=3x3x3&setup=")
        assert "&alg=" in url and url.endswith("&type=alg")
        assert " " not in url


# --- the guide --------------------------------------------------------------


def test_the_guide_is_what_the_fixture_generates(cases):
    written = pll_refs.GUIDE.read_text()
    assert written == pll_refs.build_guide(cases)


def test_the_guide_shows_every_case_exactly_once(cases):
    written = pll_refs.GUIDE.read_text()
    for case in cases:
        assert written.count(f'alt="PLL {case["name"]}"') == 1
        assert case["alg"] in written


def test_the_guide_has_the_minimal_section_linking_the_full_reference(cases):
    written = pll_refs.GUIDE.read_text()
    assert "0. Minimal PLL formulas" in written
    for name in MINIMAL:
        assert f"<strong>{name}</strong>" in written


def test_every_reference_in_the_guide_resolves():
    written = pll_refs.GUIDE.read_text()
    missing = [
        src for src in re.findall(r'src="(img/[^"]+)"', written)
        if not (PROJECT / src).exists()
    ]
    assert missing == []
