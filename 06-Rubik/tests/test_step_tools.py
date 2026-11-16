"""The step-column colours in the OLL guides.

The colour of a case's step column is not hand-written: `tools/step_tools.py`
tags each cell with the trigger the row starts with, and the style block turns
that tag into a tint of one CSS custom property. These tests hold both halves
together, so editing a flow cannot leave the old colour behind, and editing the
palette cannot leave a row unpainted.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

import pytest

PROJECT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT))

from tools.oll_refs import HTML_FILES  # noqa: E402
from tools.step_tools import TOOLS, audit, first_tool  # noqa: E402

GUIDES = list(HTML_FILES)
PICKER_RE = re.compile(
    r'<input type="color" class="tool-color" data-tool="(?P<tool>\w+)" '
    r'value="(?P<colour>#[0-9a-fA-F]{6})"'
)
VARIABLE_RE = re.compile(r"--tool-(?P<tool>\w+):\s*(?P<colour>#[0-9a-fA-F]{6})")


@pytest.mark.parametrize("guide", GUIDES)
def test_every_step_cell_is_tagged_with_its_first_trigger(guide):
    assert audit(PROJECT / guide) == []


@pytest.mark.parametrize("guide", GUIDES)
def test_every_tool_paints_its_rows(guide):
    text = (PROJECT / guide).read_text()
    for tool in TOOLS:
        assert f"--tool-{tool}:" in text, f"{guide} has no palette entry for {tool}"
        assert f'td[data-tool="{tool}"]' in text, f"{guide} paints no row for {tool}"


@pytest.mark.parametrize("guide", GUIDES)
def test_every_tool_has_a_picker_set_to_its_palette_default(guide):
    text = (PROJECT / guide).read_text()
    palette = {m["tool"]: m["colour"] for m in VARIABLE_RE.finditer(text)}
    pickers = {m["tool"]: m["colour"] for m in PICKER_RE.finditer(text)}
    assert sorted(pickers) == sorted(TOOLS), f"{guide} pickers are {sorted(pickers)}"
    assert pickers == palette, f"{guide} pickers disagree with the palette"
    assert len(set(palette.values())) == len(TOOLS), "the four defaults must differ"


@pytest.mark.parametrize("guide", GUIDES)
def test_every_row_is_painted(guide):
    text = (PROJECT / guide).read_text()
    cells = re.findall(r'<td class="(?:flow-text|seq)" data-tool="\w+"', text)
    assert len(cells) == 57, f"{guide} paints {len(cells)} of 57 step columns"


def test_first_tool_skips_setup_turns():
    assert first_tool("flow-text", "U2 setup &rarr; Edge Trigger &rarr; SOLVED") == "et"
    assert first_tool("seq", "U2 → ET → S → S → SOLVED") == "et"


def test_first_tool_keeps_sune_and_anti_sune_apart():
    assert first_tool("flow-text", "Sune &rarr; U' setup &rarr; OCLL6 (Anti-Sune)") == "s"
    assert first_tool("flow-text", "Anti-Sune &rarr; SOLVED") == "as"
    assert first_tool("seq", "AS → SOLVED") == "as"
    assert first_tool("seq", "S → SOLVED") == "s"


def test_first_tool_reads_the_wide_trigger():
    assert first_tool("flow-text", "Wide Trigger &rarr; T2") == "wt"
    assert first_tool("seq", "WT → ET → SOLVED") == "wt"


def test_first_tool_gives_up_when_a_row_has_no_trigger():
    assert first_tool("seq", "U2 → SOLVED") is None
