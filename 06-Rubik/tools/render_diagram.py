"""Draw the flat OLL diagrams from the PDF ground truth.

Why this exists: the original `friedrich-oll-*.png` art carried the edge
orientation (the stickers around the 3x3 face) as 1-pixel slivers at the canvas
edge, clipped so hard that cases differing only in edge orientation came out
pixel-identical — Sune and Anti-Sune among them. 14 pairs were indistinguishable.

This renderer draws the same information from `tests/fixtures/oll_cases.json`,
which was extracted from the reference PDF, so every diagram is both correct and
unique:

- 3x3 face in the project palette: amber = oriented, white = not;
- a 12-sticker ring around it, 3 slots per side: amber = that edge is oriented,
  grey = it is not.

Each file keeps its historical number: `tests/fixtures/file_to_case.json` says
which OLL case it shows, so redrawing never renumbers the folder. Canonical
orientation is taken from the PDF, so a diagram can be compared directly against
the reference document.

Usage:

    .venv/bin/python -m tools.render_diagram            # redraw all 57
    .venv/bin/python -m tools.render_diagram --dry-run  # report only
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw

from .oll_refs import IMG_DIR, PROJECT, load_cases

MAPPING_PATH = PROJECT / "tests" / "fixtures" / "file_to_case.json"
SIZE = 82
RING = 6                     # width of the side-sticker band
GRID = SIZE - 2 * RING       # 70
LINE = 2                     # grid line thickness
BAR_INSET = 4                # gap at each end of a side sticker

AMBER = (255, 204, 0)
WHITE = (255, 255, 255)
GREY = (168, 168, 168)
BLACK = (0, 0, 0)


def _side_slots(sig: str) -> dict[str, list[int]]:
    ring = [int(bit) for bit in sig[9:]]
    return {
        "top": ring[0:3],
        "bottom": ring[3:6],
        "left": ring[6:9],
        "right": ring[9:12],
    }


def render(sig: str, size: int = SIZE) -> Image.Image:
    """Draw one diagram from its 21-character signature."""
    img = Image.new("RGB", (size, size), WHITE)
    draw = ImageDraw.Draw(img)
    cell = GRID / 3

    for row in range(3):
        for col in range(3):
            if sig[row * 3 + col] != "Y":
                continue
            x0 = RING + col * cell
            y0 = RING + row * cell
            draw.rectangle([x0, y0, x0 + cell, y0 + cell], fill=AMBER)

    for index in range(4):                      # grid lines
        offset = round(index * cell)
        draw.line([(RING + offset, RING), (RING + offset, RING + GRID)], fill=BLACK, width=LINE)
        draw.line([(RING, RING + offset), (RING + GRID, RING + offset)], fill=BLACK, width=LINE)

    slots = _side_slots(sig)
    for index, oriented in enumerate(slots["top"]):
        x0 = RING + index * cell + BAR_INSET
        x1 = RING + (index + 1) * cell - BAR_INSET
        draw.rectangle([x0, 0, x1, RING - 1], fill=AMBER if oriented else GREY)
    for index, oriented in enumerate(slots["bottom"]):
        x0 = RING + index * cell + BAR_INSET
        x1 = RING + (index + 1) * cell - BAR_INSET
        draw.rectangle([x0, RING + GRID + 1, x1, size - 1], fill=AMBER if oriented else GREY)
    for index, oriented in enumerate(slots["left"]):
        y0 = RING + index * cell + BAR_INSET
        y1 = RING + (index + 1) * cell - BAR_INSET
        draw.rectangle([0, y0, RING - 1, y1], fill=AMBER if oriented else GREY)
    for index, oriented in enumerate(slots["right"]):
        y0 = RING + index * cell + BAR_INSET
        y1 = RING + (index + 1) * cell - BAR_INSET
        draw.rectangle([RING + GRID + 1, y0, size - 1, y1], fill=AMBER if oriented else GREY)

    return img


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="report without writing")
    args = parser.parse_args(argv)

    cases = load_cases()
    mapping = {int(file): oll for file, oll in json.loads(MAPPING_PATH.read_text()).items()}
    for number, oll in sorted(mapping.items()):
        target = IMG_DIR / f"friedrich-oll-{number:02d}.png"
        if not args.dry_run:
            render(cases[oll]["signature"]).save(target)
    print(f"{'would redraw' if args.dry_run else 'redrew'} {len(mapping)} diagrams")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
