"""Turn the minimal guide's step column into a lane-per-case route map.

Every row of `minimal-without-flows.html` already lists the triggers, in order,
with the setup turns between them. This module replays that column on the
sticker model in `tools/cube.py` and records the shape reached after every
trigger, so the map is derived rather than retyped:

    OCLL1  --AS-->  OCLL6  --AS-->  solved

Those shapes are recognition checkpoints, not shortcuts. A shape is a pattern,
not a state: the same picture reached through a different piece permutation can
need a different follow-up, so two lanes never merge and a checkpoint never
pretends to be the row it is named after. Where a lane has fewer steps left
than that shape's own row needs, the checkpoint is marked `warn` and the page
says so, because that is exactly the case a reader would get wrong by jumping.

The same lanes are published twice, because there are two useful ways to cut
them: by the shape a lane lands on before its last trigger
(`oll-route-map.html`), and by the formula a lane starts with
(`oll-route-map-first-step.html`), which is the colour the step list already
gives each case.

Usage:

    .venv/bin/python -m tools.route_graph --write   # fixture + both pages
    .venv/bin/python -m tools.route_graph --check   # report drift
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from . import cube as C
from .oll_refs import PROJECT

GUIDE = PROJECT / "minimal-without-flows.html"
PAGE_LANDING = PROJECT / "oll-route-map.html"
PAGE_FIRST_STEP = PROJECT / "oll-route-map-first-step.html"
PAGES = {"landing": PAGE_LANDING, "first-step": PAGE_FIRST_STEP}
FIXTURE = PROJECT / "tests/fixtures/oll_routes.json"
CASES = PROJECT / "tests/fixtures/oll_cases.json"
FILE_TO_CASE = PROJECT / "tests/fixtures/file_to_case.json"

TOOL_ALGS = {
    "S": "R U R' U R U2' R'",
    "AS": "R U2' R' U' R U' R'",
    "ET": "F R U R' U' F'",
    "WT": "f R U R' U' f'",
}

TOOL_NAMES = {
    "S": "Sune",
    "AS": "Anti-Sune",
    "ET": "Edge Trigger",
    "WT": "Wide Edge Trigger",
}

AUF_TURNS = {"U": 1, "U2": 2, "U'": 3}
AUF_LABEL = {0: "", 1: "U", 2: "U2", 3: "U'"}

SOLVED = 0

ROW_RE = re.compile(r"<tr>(?P<body>.*?)</tr>", re.S)
IMG_RE = re.compile(r'<img src="(?P<src>[^"]+)" alt="OLL (?P<oll>\d+)">')
NAME_RE = re.compile(
    r'class="case-title">(?P<name>[^<]+)</span>'
    r'<span class="case-code">OLL (?P<code>\d+)'
)
SEQ_RE = re.compile(r'class="seq" data-tool="(?P<tool>[a-z]+)">(?P<text>[^<]+)<')
HREF_RE = re.compile(r'href="(?P<href>https://alg\.cubing\.net/[^"]+)"')
STEP_SPLIT = re.compile(r"\s*(?:&rarr;|→)\s*")


class RouteError(RuntimeError):
    """A route could not be replayed on the cube model."""


# ---------------------------------------------------------------- the cube model


def _rotations() -> list[str]:
    """Every whole-cube orientation reachable from x/y/z turns of at most two."""
    quarter = ["", "x", "x2", "x'", "y", "y2", "y'", "z", "z2", "z'"]
    return [(a + " " + b).strip() for a in quarter for b in quarter]


ORIENTATIONS = _rotations()


def _up(state: dict) -> dict:
    """The same cube turned so the yellow (U-coloured) centre faces up."""
    seen = {}
    for orientation in ORIENTATIONS:
        turned = C.apply_alg(dict(state), orientation)
        if turned[((0, 1, 0), C.UP)] != "U":
            continue
        seen.setdefault(tuple(sorted(turned.items())), turned)
    if not seen:
        raise RouteError("no orientation puts the yellow centre on top")
    return next(iter(seen.values()))


def face_pattern(state: dict) -> str:
    """Nine top stickers, back row first; `Y` when the sticker is oriented."""
    return "".join(
        "Y" if state[((x, 1, z), C.UP)] == "U" else "."
        for z in (-1, 0, 1)
        for x in (-1, 0, 1)
    )


def signature(state: dict) -> str:
    """The 21-character shape: nine top stickers plus the twelve side stickers."""
    sides = (
        (((x, 1, -1), (0, 0, -1)) for x in (-1, 0, 1)),   # back
        (((x, 1, 1), (0, 0, 1)) for x in (-1, 0, 1)),     # front
        (((-1, 1, z), (-1, 0, 0)) for z in (-1, 0, 1)),   # left
        (((1, 1, z), (1, 0, 0)) for z in (-1, 0, 1)),     # right
    )
    ring = "".join(
        "1" if state[key] == "U" else "0" for group in sides for key in group
    )
    return face_pattern(state) + ring


def case_states() -> dict[int, dict]:
    """The cube model's own state for each PDF case, yellow side up."""
    states = {}
    for case in json.loads(CASES.read_text()):
        alg = case["alg"].split("/")[0].strip()
        states[case["oll"]] = _up(C.apply_alg(C.solved(), C.inverse_alg(alg)))
    return states


def shape_index(states: dict[int, dict]) -> dict[str, int]:
    """Signature -> OLL number, over the four turns of every case's shape."""
    index = {}
    for oll, state in states.items():
        for turn in range(4):
            turned = C.apply_alg(dict(state), ("y " * turn).strip())
            index.setdefault(signature(turned), oll)
    return index


def shape_of(state: dict, index: dict[str, int]) -> int:
    """Which case-shaped pattern this cube shows, or SOLVED, or a RouteError."""
    state = _up(state)
    if face_pattern(state) == "YYYYYYYYY":
        return SOLVED
    try:
        return index[signature(state)]
    except KeyError as error:
        raise RouteError(f"shape not in the case set: {signature(state)}") from error


# ------------------------------------------------------------------- the guide


def parse_guide(path: Path = GUIDE) -> list[dict]:
    """Every case row: name, OLL number, simulator link, image and step tokens."""
    rows = []
    for match in ROW_RE.finditer(path.read_text()):
        body = match.group("body")
        seq = SEQ_RE.search(body)
        if not seq:
            continue
        image = IMG_RE.search(body)
        name = NAME_RE.search(body)
        href = HREF_RE.search(body)
        if not (image and name):
            raise RouteError(f"row without a case name or image: {body[:80]}")
        tokens = [t for t in STEP_SPLIT.split(seq.group("text").strip()) if t]
        if tokens and tokens[-1] == "SOLVED":
            tokens.pop()
        rows.append(
            {
                "oll": int(name.group("code")),
                "name": name.group("name"),
                "image": image.group("src"),
                "href": href.group("href") if href else "",
                "tokens": tokens,
                "first_tool": seq.group("tool").upper(),
            }
        )
    return rows


def _compose_auf(tokens: list[str]) -> str:
    quarter = sum(AUF_TURNS[token] for token in tokens) % 4
    return AUF_LABEL[quarter]


def replay(route: dict, state: dict, index: dict[str, int]) -> list[dict]:
    """One checkpoint per trigger: the setup turn, the trigger and the shape."""
    checkpoints: list[dict] = []
    pending: list[str] = []
    current = dict(state)
    for token in route["tokens"]:
        if token in AUF_TURNS:
            pending.append(token)
            continue
        if token not in TOOL_ALGS:
            raise RouteError(f"{route['name']}: unknown step {token!r}")
        auf = _compose_auf(pending)
        current = C.apply_alg(current, (auf + " " + TOOL_ALGS[token]).strip())
        checkpoints.append({"auf": auf, "tool": token, "shape": shape_of(current, index)})
        pending = []
    if pending:
        raise RouteError(f"{route['name']}: route ends on a setup turn")
    return checkpoints


def routes(path: Path = GUIDE) -> list[dict]:
    """Every case with its replayed checkpoints, in guide order."""
    states = case_states()
    index = shape_index(states)
    names = {case["oll"]: case["name"] for case in json.loads(CASES.read_text())}
    images = {
        int(case): f"img/friedrich-oll-{int(number):02d}.png"
        for number, case in json.loads(FILE_TO_CASE.read_text()).items()
    }
    steps = {}
    parsed = [route for route in parse_guide(path) if route["tokens"]]
    for route in parsed:
        steps[route["oll"]] = sum(1 for token in route["tokens"] if token in TOOL_ALGS)

    built = []
    for route in parsed:
        checkpoints = replay(route, states[route["oll"]], index)
        if not checkpoints or checkpoints[-1]["shape"] != SOLVED:
            raise RouteError(f"{route['name']}: route does not end solved")
        if checkpoints[0]["tool"].lower() != route["first_tool"].lower():
            raise RouteError(f"{route['name']}: step column disagrees with its colour tag")
        remaining = len(checkpoints)
        for position, checkpoint in enumerate(checkpoints, start=1):
            left = remaining - position
            checkpoint["remaining"] = left
            checkpoint["warn"] = (
                checkpoint["shape"] != SOLVED
                and checkpoint["shape"] in steps
                and left < steps[checkpoint["shape"]]
            )
        landing = checkpoints[-2]["shape"] if len(checkpoints) > 1 else SOLVED
        built.append(
            {
                "oll": route["oll"],
                "name": route["name"],
                "image": images.get(route["oll"], route["image"]),
                "href": route["href"],
                "steps": len(checkpoints),
                "landing": landing,
                "route": [
                    {
                        "auf": checkpoint["auf"],
                        "tool": checkpoint["tool"],
                        "shape": checkpoint["shape"],
                        "shape_name": (
                            "solved" if checkpoint["shape"] == SOLVED else names[checkpoint["shape"]]
                        ),
                        "remaining": checkpoint["remaining"],
                        "warn": checkpoint["warn"],
                    }
                    for checkpoint in checkpoints
                ],
            }
        )
    return built


def fixture(path: Path = GUIDE) -> dict:
    """The route map as data: one lane per case, in guide order.

    Grouping is a property of the view, not of the lane, so the fixture holds
    the lanes once and each page computes its own blocks from them.
    """
    return {"cases": routes(path)}


def _names() -> dict[int, str]:
    return {case["oll"]: case["name"] for case in json.loads(CASES.read_text())}


def _images() -> dict[int, str]:
    return {
        int(case): f"img/friedrich-oll-{int(number):02d}.png"
        for number, case in json.loads(FILE_TO_CASE.read_text()).items()
    }


def group_by_landing(data: dict) -> list[dict]:
    """Blocks by the shape a lane lands on before its last trigger."""
    names, images = _names(), _images()
    groups: dict[int, list[dict]] = {}
    for case in data["cases"]:
        groups.setdefault(case["landing"], []).append(case)

    blocks = []
    for landing in sorted(groups, key=lambda oll: (oll == SOLVED, -len(groups[oll]), oll)):
        lanes = groups[landing]
        solved = landing == SOLVED
        blocks.append(
            {
                "key": "solved" if solved else f"shape-{landing}",
                "title": (
                    "Solved in one trigger"
                    if solved
                    else f"Ends at {names[landing]} / OLL {landing}"
                ),
                "landing": landing,
                "landing_image": "" if solved else images.get(landing, ""),
                "tool": "",
                "alg": "",
                "count": len(lanes),
                "steps": max(lane["steps"] for lane in lanes),
                "cases": lanes,
            }
        )
    return blocks


def group_by_first_step(data: dict) -> list[dict]:
    """Blocks by the formula a lane starts with, in the toolbox's own order."""
    groups: dict[str, list[dict]] = {}
    for case in data["cases"]:
        groups.setdefault(case["route"][0]["tool"], []).append(case)

    blocks = []
    for tool in TOOL_ALGS:
        lanes = sorted(groups.get(tool, []), key=lambda case: case["steps"])
        if not lanes:
            continue
        blocks.append(
            {
                "key": f"step-{tool.lower()}",
                "title": f"Starts with {TOOL_NAMES[tool]} ({tool})",
                "landing": None,
                "landing_image": "",
                "tool": tool,
                "alg": TOOL_ALGS[tool],
                "count": len(lanes),
                "steps": max(lane["steps"] for lane in lanes),
                "cases": lanes,
            }
        )
    return blocks


# ------------------------------------------------------------------- the page

PAGE_CSS = """
        :root {
            --tool-s: #d9534f;
            --tool-as: #f0ad4e;
            --tool-et: #5cb85c;
            --tool-wt: #4a9fd8;
            --lane-line: #c9ccd1;
            --ink: #222;
            --muted: #667;
        }
        * { box-sizing: border-box; }
        body { font-family: Arial, sans-serif; margin: 30px; color: var(--ink);
            line-height: 1.5; background: #fafafa; }
        h1 { color: #111; border-bottom: 3px solid #333; padding-bottom: 8px; }
        h2 { color: #222; border-bottom: 2px solid #ccc; padding-bottom: 5px;
            margin-top: 40px; display: flex; align-items: center; gap: 10px; }
        h2 img { width: 34px; height: 34px; }
        h2 .count { font-size: 14px; font-weight: normal; color: var(--muted); }
        p { color: #555; }
        .nav { font-size: 13px; color: var(--muted); margin: 0 0 6px 0; }
        .nav a { color: #0056b3; }
        .swatch { width: 14px; height: 14px; border-radius: 3px; display: inline-block; }
        .swatch[data-tool="s"] { background: var(--tool-s); }
        .swatch[data-tool="as"] { background: var(--tool-as); }
        .swatch[data-tool="et"] { background: var(--tool-et); }
        .swatch[data-tool="wt"] { background: var(--tool-wt); }
        .block-alg { font-family: "Courier New", monospace; font-size: 12px;
            color: #333; margin: -12px 0 12px 0; }
        .toolbox { background: #f8f9fa; border-left: 4px solid #007bff; padding: 15px;
            margin-bottom: 30px; font-size: 13px; }
        .toolbox ul { margin: 5px 0 0 20px; padding: 0; }
        input.tool-color { width: 26px; height: 20px; padding: 0; border: 1px solid #bbb;
            border-radius: 3px; background: none; vertical-align: middle; cursor: pointer; }
        .hint { font-size: 12px; color: var(--muted); margin: 8px 0 0 0; }

        .lanes { background: #fff; border: 1px solid #e3e5e8; border-radius: 6px;
            padding: 8px 12px; margin: 15px 0 30px; overflow-x: auto; }
        .lane { display: flex; align-items: stretch; padding: 4px 0;
            border-bottom: 1px solid #f0f1f3; min-width: 620px; }
        .lane:last-child { border-bottom: 0; }
        .cell { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }
        .cell.case { width: 172px; }
        .cell.shape { width: 96px; }
        .cell.solved { width: 96px; }
        .cell img { width: 40px; height: 40px; object-fit: contain; border-radius: 4px;
            background: #fff; cursor: zoom-in; transition: transform .15s ease-out; }
        .cell img:hover { transform: scale(2.2); position: relative; z-index: 30;
            box-shadow: 0 6px 18px rgba(0,0,0,.25); }
        .label { display: flex; flex-direction: column; line-height: 1.15; }
        .label b { font-size: 13px; }
        .label i { font-size: 11px; color: var(--muted); font-style: normal; }
        .step { width: 82px; position: relative; display: flex; align-items: center;
            justify-content: center; }
        .step::before { content: ""; position: absolute; left: 0; right: 0; top: 50%;
            height: 2px; background: var(--lane-line); z-index: 0; }
        .step::after { content: ""; position: absolute; right: -1px; top: 50%;
            margin-top: -5px; border-left: 6px solid var(--lane-line);
            border-top: 5px solid transparent; border-bottom: 5px solid transparent; }
        .step .chip { position: relative; z-index: 1; font-size: 11px; font-weight: bold;
            padding: 2px 6px; border-radius: 10px; border: 1px solid rgba(0,0,0,.12);
            background: #fff; white-space: nowrap; }
        .step[data-tool="s"] .chip { background: color-mix(in srgb, var(--tool-s) 30%, #fff); }
        .step[data-tool="as"] .chip { background: color-mix(in srgb, var(--tool-as) 30%, #fff); }
        .step[data-tool="et"] .chip { background: color-mix(in srgb, var(--tool-et) 30%, #fff); }
        .step[data-tool="wt"] .chip { background: color-mix(in srgb, var(--tool-wt) 30%, #fff); }
        .solved-badge { font-size: 12px; font-weight: bold; color: #2e7d32;
            border: 1px solid #a5d6a7; background: #eef7ee; border-radius: 10px;
            padding: 3px 9px; }
        .warn { display: inline-flex; align-items: center; justify-content: center;
            width: 15px; height: 15px; border-radius: 50%; font-size: 10px;
            font-weight: bold; color: #7a5a00; background: #ffe8a3;
            border: 1px solid #e2c46a; cursor: help; }
        .direct { display: flex; flex-wrap: wrap; gap: 22px; background: #fff;
            border: 1px solid #e3e5e8; border-radius: 6px; padding: 16px 18px; margin: 15px 0 30px; }
        .direct .row { display: flex; align-items: center; gap: 8px; }
"""

PAGE_JS = """
    <script>
        // Same palette parameter as the step list: one key, both pages follow.
        (function () {
            var KEY = "oll-tool-colors";
            var root = document.documentElement;
            var pickers = Array.prototype.slice.call(document.querySelectorAll("input.tool-color"));
            var saved = {};
            try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (error) { saved = {}; }

            function apply(tool, colour) {
                root.style.setProperty("--tool-" + tool, colour);
            }

            pickers.forEach(function (picker) {
                var tool = picker.dataset.tool;
                if (saved[tool]) { picker.value = saved[tool]; }
                apply(tool, picker.value);
                picker.addEventListener("input", function () {
                    apply(tool, picker.value);
                    saved[tool] = picker.value;
                    try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (error) {}
                });
            });
        })();
    </script>
"""


def _case_cell(case: dict) -> str:
    image = (
        f'<a href="{case["href"]}" target="_blank" rel="noopener" '
        f'title="Open this position in the cube simulator">'
        f'<img src="{case["image"]}" alt="OLL {case["oll"]}"></a>'
        if case["href"]
        else f'<img src="{case["image"]}" alt="OLL {case["oll"]}">'
    )
    step_word = "step" if case["steps"] == 1 else "steps"
    return (
        f'<div class="cell case">{image}'
        f'<span class="label"><b>{case["name"]}</b>'
        f'<i>OLL {case["oll"]} · {case["steps"]} {step_word}</i></span></div>'
    )


def _shape_cell(checkpoint: dict, cases_by_oll: dict[int, dict], names: dict[int, str]) -> str:
    shape = checkpoint["shape"]
    if shape == SOLVED:
        return '<div class="cell solved"><span class="solved-badge">solved</span></div>'
    case = cases_by_oll.get(shape, {})
    image = case.get("image", "")
    title = f"shape {names.get(shape, shape)} (OLL {shape})"
    if checkpoint["warn"]:
        title += (
            f". Landmark, not a shortcut: this lane has {checkpoint['remaining']} "
            f"step(s) left, while OLL {shape}'s own row needs more. Follow the lane."
        )
    warn = ""
    if checkpoint["warn"]:
        warn = f' <span class="warn" title="{title}">!</span>'
    return (
        f'<div class="cell shape">'
        f'<img src="{image}" alt="shape {names.get(shape, shape)}" title="{title}">'
        f'<span class="label"><b>{names.get(shape, shape)}</b>'
        f'<i>OLL {shape}</i></span>{warn}</div>'
    )


def _step_cell(checkpoint: dict) -> str:
    tool = checkpoint["tool"]
    label = f"{checkpoint['auf']} + {tool}" if checkpoint["auf"] else tool
    tool_name = TOOL_NAMES.get(tool, tool)
    return (
        f'<div class="step" data-tool="{tool.lower()}" title="{label} ({tool_name})">'
        f'<span class="chip">{label}</span></div>'
    )


MODES = {
    "landing": {
        "page": PAGE_LANDING,
        "title": "OLL Route Map",
        "heading": "OLL Route Map",
        "intro": (
            "One lane per case, left to right: the case you hold, the setup turn and\n"
            "    trigger you need, and the shape you should now be looking at. Every lane\n"
            "    ends on the solved yellow face. Lanes are grouped by the shape they land on\n"
            "    before their last trigger, so a group is a promise of the form \"turn it into\n"
            "    this shape, then one trigger finishes it\"."
        ),
        "groups": group_by_landing,
    },
    "first-step": {
        "page": PAGE_FIRST_STEP,
        "title": "OLL Route Map - by first formula",
        "heading": "OLL Route Map - by first formula",
        "intro": (
            "The same lanes, cut a different way: grouped by the first formula you\n"
            "    apply, which is exactly the colour a case carries in the step list. A lane\n"
            "    joins a block by its formula even when a setup turn comes first, so \"U2 + S\"\n"
            "    sits under Sune. Within a block the lanes get one step longer as you read\n"
            "    down, so the case you can already solve comes first."
        ),
        "groups": group_by_first_step,
    },
}

NAV = (
    '    <p class="nav">Grouping: '
    '<a href="oll-route-map.html">by landing shape</a> · '
    '<a href="oll-route-map-first-step.html">by first formula</a></p>'
)


def _heading(block: dict, mode: str) -> str:
    count = f'<span class="count">{block["count"]} cases</span>'
    if mode == "first-step":
        swatch = f'<span class="swatch" data-tool="{block["tool"].lower()}"></span>'
        return (
            f'<h2 id="block-{block["key"]}">{swatch}{block["title"]} {count}</h2>\n'
            f'        <p class="block-alg">{block["alg"]}</p>'
        )
    image = (
        f'<img src="{block["landing_image"]}" alt="{block["title"]}">'
        if block["landing_image"]
        else ""
    )
    return f'<h2 id="block-{block["key"]}">{image}{block["title"]} {count}</h2>'


def render(data: dict, mode: str = "landing") -> str:
    names = _names()
    cases_by_oll = {case["oll"]: case for case in data["cases"]}
    config = MODES[mode]

    toolbox = "\n".join(
        f'            <li><strong>{TOOL_NAMES[tool]} ({tool}):</strong> {alg} '
        f'<input type="color" class="tool-color" data-tool="{tool.lower()}" '
        f'value="{colour}" title="{TOOL_NAMES[tool]} colour"></li>'
        for tool, alg, colour in (
            ("S", TOOL_ALGS["S"], "#d9534f"),
            ("AS", TOOL_ALGS["AS"], "#f0ad4e"),
            ("ET", TOOL_ALGS["ET"], "#5cb85c"),
            ("WT", TOOL_ALGS["WT"], "#4a9fd8"),
        )
    )

    sections = []
    for block in config["groups"](data):
        heading = _heading(block, mode)
        if block["landing"] == SOLVED:
            rows = "".join(
                f'<div class="row">{_case_cell(case)}'
                f'{_step_cell(case["route"][0])}'
                f'<div class="cell solved"><span class="solved-badge">solved</span></div></div>'
                for case in block["cases"]
            )
            sections.append(f'{heading}\n        <div class="direct">{rows}</div>')
            continue

        lanes = []
        for case in block["cases"]:
            cells = [_case_cell(case)]
            for checkpoint in case["route"]:
                cells.append(_step_cell(checkpoint))
                cells.append(_shape_cell(checkpoint, cases_by_oll, names))
            lanes.append('<div class="lane">' + "".join(cells) + "</div>")
        sections.append(
            f'{heading}\n        <div class="lanes">\n            '
            + "\n            ".join(lanes)
            + "\n        </div>"
        )

    body = "\n\n        ".join(sections)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{config["title"]}</title>
    <style>{PAGE_CSS}
    </style>
</head>
<body>

    <h1>{config["heading"]}</h1>
{NAV}
    <p>{config["intro"]}</p>

    <div class="toolbox">
        <strong>0. The four triggers</strong>
        <ul>
{toolbox}
        </ul>
        <p class="hint">Click a cube to open that position in the simulator. The
        colour pickers are the same setting as the step list's, so a recolour here
        applies there too.</p>
        <p class="hint"><strong>!</strong> marks a shape that looks like a case
        with its own row, but from this lane fewer steps are left than that row
        needs. Follow the lane; do not jump to the row.</p>
    </div>

    <p>Every shape name and number below is replayed from the step list on a cube
    model, not typed by hand: if a lane's shape were wrong, the page would fail its
    check instead of teaching a wrong turn.</p>

        {body}

</body>
</html>
{PAGE_JS}"""


# ---------------------------------------------------------------------- the CLI


def build() -> dict[Path, str]:
    """The fixture and every page, as the text they should contain."""
    data = fixture()
    built = {FIXTURE: json.dumps(data, indent=1) + "\n"}
    for mode in MODES:
        built[MODES[mode]["page"]] = render(data, mode)
    return built


def audit() -> list[str]:
    problems = []
    try:
        built = build()
    except RouteError as error:
        return [f"route graph: {error}"]

    for path, expected in built.items():
        if not path.exists():
            problems.append(f"{path.name}: missing; run --write")
        elif path.read_text() != expected:
            problems.append(f"{path.name}: does not match the guide; run --write")

    try:
        data = json.loads(built[FIXTURE])
    except json.JSONDecodeError:
        return problems + [f"{FIXTURE.name}: generated fixture is not valid JSON"]

    cases = data["cases"]
    if len(cases) != 57:
        problems.append(f"route map: {len(cases)} cases, expected 57")
    numbers = [case["oll"] for case in cases]
    if len(set(numbers)) != len(numbers):
        problems.append("route map: a case appears in more than one lane")
    for case in cases:
        if case["route"][-1]["shape"] != SOLVED:
            problems.append(f"{case['name']}: lane does not end solved")

    for mode in MODES:
        blocks = MODES[mode]["groups"](data)
        total = sum(block["count"] for block in blocks)
        if total != len(cases):
            problems.append(f"{mode}: blocks hold {total} lanes, expected {len(cases)}")
        for block in blocks:
            if block["count"] != len(block["cases"]):
                problems.append(f"{mode}: {block['title']} count disagrees with its lanes")
    return problems


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="report problems (the default)")
    parser.add_argument("--write", action="store_true", help="rewrite the fixture and the pages")
    args = parser.parse_args(argv)

    if args.write:
        for path, text in build().items():
            path.write_text(text)
            print(f"{path.name}: written")

    problems = audit()
    for problem in problems:
        print(problem)
    print(f"\n{len(problems)} problem(s)")
    return 1 if problems else 0


if __name__ == "__main__":
    raise SystemExit(main())
