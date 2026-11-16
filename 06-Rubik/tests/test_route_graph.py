"""The route maps: every lane replayed, every shape checked, both groupings.

`tools/route_graph.py` derives the map's shapes from the guide's step column by
replaying it on the cube model, then publishes the same lanes twice: grouped by
the shape a lane lands on, and grouped by the formula it starts with. These
tests hold both pages to that derivation, so a lane cannot show a shape the cube
does not produce, and a case cannot fall out of a block or appear twice.

The depth test pins the property the pages' prose depends on: a lane always
arrives at a shape with exactly as many steps left as that shape's own row
needs. While that holds, a checkpoint really is a landmark; the `warn` flag in
the fixture (a shape with *fewer* steps left than its row) is the safety net for
the edit that would break it.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

PROJECT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT))

from tools import route_graph  # noqa: E402

DATA = json.loads(route_graph.FIXTURE.read_text())
CASES = DATA["cases"]
BY_LANDING = route_graph.group_by_landing(DATA)
BY_FIRST_STEP = route_graph.group_by_first_step(DATA)
ONE_TRIGGER = {case["oll"] for case in CASES if case["steps"] == 1}


def test_every_lane_ends_on_the_solved_face():
    for case in CASES:
        assert case["route"], case["name"]
        assert case["route"][-1]["shape"] == route_graph.SOLVED, case["name"]


def test_every_case_appears_exactly_once():
    numbers = [case["oll"] for case in CASES]
    assert len(numbers) == 57
    assert len(set(numbers)) == len(numbers)


def test_landing_blocks_are_the_landing_shapes_and_their_counts_are_real():
    assert sum(block["count"] for block in BY_LANDING) == 57
    for block in BY_LANDING:
        assert block["count"] == len(block["cases"])
        for case in block["cases"]:
            assert case["landing"] == block["landing"], case["name"]
    # The shape a lane ends on must be one trigger from solved, so the only
    # possible landings are the four one-trigger cases and solved itself.
    assert {block["landing"] for block in BY_LANDING} == ONE_TRIGGER | {route_graph.SOLVED}


def test_first_step_blocks_are_the_toolbox_triggers():
    assert [block["tool"] for block in BY_FIRST_STEP] == list(route_graph.TOOL_ALGS)
    assert sum(block["count"] for block in BY_FIRST_STEP) == 57
    for block in BY_FIRST_STEP:
        assert block["count"] == len(block["cases"])
        assert block["alg"] == route_graph.TOOL_ALGS[block["tool"]]
        for case in block["cases"]:
            assert case["route"][0]["tool"] == block["tool"], case["name"]


def test_first_step_blocks_read_shortest_lane_first():
    for block in BY_FIRST_STEP:
        steps = [case["steps"] for case in block["cases"]]
        assert steps == sorted(steps), block["title"]


def test_the_two_groupings_hold_the_same_lanes():
    landing = sorted(case["oll"] for block in BY_LANDING for case in block["cases"])
    first = sorted(case["oll"] for block in BY_FIRST_STEP for case in block["cases"])
    assert landing == first == sorted(case["oll"] for case in CASES)


def test_reached_shapes_are_cases_from_the_pdf():
    known = {case["oll"] for case in CASES} | {route_graph.SOLVED}
    for case in CASES:
        for checkpoint in case["route"]:
            assert checkpoint["shape"] in known, case["name"]


def test_a_checkpoint_keeps_the_row_depth_of_the_shape_it_names():
    """Landing on a shape means being exactly as deep as that shape's own row."""
    depth = {case["oll"]: case["steps"] for case in CASES}
    for case in CASES:
        for checkpoint in case["route"][:-1]:
            assert checkpoint["remaining"] == depth[checkpoint["shape"]], (
                case["name"],
                checkpoint,
            )
            assert not checkpoint["warn"], case["name"]


def test_one_trigger_cases_are_drawn_without_a_checkpoint():
    for case in CASES:
        if case["steps"] == 1:
            assert len(case["route"]) == 1
            assert case["landing"] == route_graph.SOLVED


def test_the_first_step_matches_the_step_column_colour():
    parsed = {row["oll"]: row for row in route_graph.parse_guide()}
    for case in CASES:
        tag = parsed[case["oll"]]["first_tool"].upper()
        assert case["route"][0]["tool"] == tag, case["name"]


def test_both_pages_and_the_fixture_are_generated_not_edited():
    for path, expected in route_graph.build().items():
        assert path.read_text() == expected, path.name


def test_the_audit_is_clean():
    assert route_graph.audit() == []
