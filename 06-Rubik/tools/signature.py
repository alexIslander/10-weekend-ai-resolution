"""Diagram signatures for OLL case art.

An OLL diagram has two parts:

- the 3x3 top face (9 stickers), yellow = oriented;
- a ring of side stickers around it (3 per side, 12 total), yellow = oriented.

Both are read from the artwork into a 21-character signature:

    <9 cells, row-major> <3 top> <3 bottom> <3 left> <3 right>

using 'Y' for a yellow sticker and '.' / '0' for anything else. Two pieces of
art that show the same case produce the same signature, even when the case is
drawn rotated, because `rotations()` maps a signature through the four
rotations of a 5x5 grid (3x3 face + 1-sticker ring).

Mirror images are deliberately *not* part of the transform set: mirror pairs
(e.g. K2/K3, OCLL6/OCLL7) are different cases and must stay distinguishable.

Only Pillow is required: the artwork geometry is passed in by the caller as
`Face` (pixel bounds of the 3x3 block), because the HTML crops and the PDF
renders use different templates.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from PIL import Image

CELL_MARGIN = 0.30      # fraction of a cell left out on each side when sampling
YELLOW_MIN_RED = 170    # a sticker counts as yellow if ...
YELLOW_MIN_GREEN = 100
YELLOW_MAX_BLUE = 120
MIN_BLOB_PIXELS = 6


@dataclass(frozen=True)
class Face:
    """Pixel bounds of the 3x3 top-face block inside an artwork."""

    x0: int
    y0: int
    x1: int
    y1: int


def yellow_mask(img: Image.Image) -> np.ndarray:
    rgb = np.asarray(img.convert("RGB")).astype(int)
    red, green, blue = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    return (red > YELLOW_MIN_RED) & (green > YELLOW_MIN_GREEN) & (blue < YELLOW_MAX_BLUE)


def ink_mask(img: Image.Image) -> np.ndarray:
    rgb = np.asarray(img.convert("RGB")).astype(int)
    return (rgb[..., 0] < 120) & (rgb[..., 1] < 120) & (rgb[..., 2] < 120)


def _clusters(indices) -> list[tuple[int, int]]:
    runs: list[list[int]] = []
    for index in indices:
        if runs and index - runs[-1][-1] <= 2:
            runs[-1].append(int(index))
        else:
            runs.append([int(index)])
    return [(run[0], run[-1]) for run in runs]


def detect_face(img: Image.Image, coverage: float = 0.82) -> Face:
    """Locate the 3x3 block by its four full-length grid lines.

    Used for PDF renders, whose scale varies with the size of the embedded art,
    so the block cannot be described by fixed pixel bounds.
    """
    mask = ink_mask(img)
    height, width = mask.shape
    rows = _clusters(np.where(mask.sum(axis=1) > coverage * width)[0])
    cols = _clusters(np.where(mask.sum(axis=0) > coverage * height)[0])
    if len(rows) != 4 or len(cols) != 4:
        raise ValueError(f"expected 4 grid lines each way, found {len(rows)} rows / {len(cols)} cols")
    return Face(cols[0][0], rows[0][0], cols[-1][1], rows[-1][1])


def _blobs(mask: np.ndarray, min_pixels: int = MIN_BLOB_PIXELS):
    """Yield (centre_x, centre_y) for each 4-connected blob of at least min_pixels."""
    height, width = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    for sy in range(height):
        for sx in range(width):
            if not mask[sy, sx] or seen[sy, sx]:
                continue
            stack = [(sy, sx)]
            seen[sy, sx] = True
            pixels = []
            while stack:
                cy, cx = stack.pop()
                pixels.append((cy, cx))
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < height and 0 <= nx < width and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        stack.append((ny, nx))
            if len(pixels) < min_pixels:
                continue
            ys = [p[0] for p in pixels]
            xs = [p[1] for p in pixels]
            yield (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2


def signature(img: Image.Image, face: Face) -> str:
    """Read the 21-character signature of one OLL diagram."""
    mask = yellow_mask(img)
    cell_w = (face.x1 - face.x0) / 3
    cell_h = (face.y1 - face.y0) / 3
    radius_x = max(2, int(cell_w * CELL_MARGIN))
    radius_y = max(2, int(cell_h * CELL_MARGIN))

    cells = []
    for row in range(3):
        for col in range(3):
            cx = face.x0 + cell_w * (col + 0.5)
            cy = face.y0 + cell_h * (row + 0.5)
            patch = mask[int(cy) - radius_y:int(cy) + radius_y + 1,
                         int(cx) - radius_x:int(cx) + radius_x + 1]
            cells.append("Y" if patch.size and patch.mean() > 0.5 else ".")

    inside = mask.copy()
    inside[face.y0:face.y1 + 1, face.x0:face.x1 + 1] = False

    ring = {"top": [0, 0, 0], "bottom": [0, 0, 0], "left": [0, 0, 0], "right": [0, 0, 0]}
    for cx, cy in _blobs(inside):
        if cy < face.y0:
            side, slot = "top", int((cx - face.x0) // cell_w)
        elif cy > face.y1:
            side, slot = "bottom", int((cx - face.x0) // cell_w)
        elif cx < face.x0:
            side, slot = "left", int((cy - face.y0) // cell_h)
        else:
            side, slot = "right", int((cy - face.y0) // cell_h)
        ring[side][min(2, max(0, slot))] = 1

    sides = "".join("".join(str(bit) for bit in ring[s]) for s in ("top", "bottom", "left", "right"))
    return "".join(cells) + sides


def _to_grid(sig: str) -> np.ndarray:
    grid = np.zeros((5, 5), dtype=int)
    for index, value in enumerate(sig[:9]):
        grid[1 + index // 3, 1 + index % 3] = 1 if value == "Y" else 0
    ring = [int(bit) for bit in sig[9:]]
    top, bottom, left, right = ring[0:3], ring[3:6], ring[6:9], ring[9:12]
    for offset in range(3):
        grid[0, 1 + offset] = top[offset]
        grid[4, 1 + offset] = bottom[offset]
        grid[1 + offset, 0] = left[offset]
        grid[1 + offset, 4] = right[offset]
    return grid


def _from_grid(grid: np.ndarray) -> str:
    cells = "".join("Y" if grid[1 + i // 3, 1 + i % 3] else "." for i in range(9))
    ring = (
        "".join(str(grid[0, 1 + k]) for k in range(3))
        + "".join(str(grid[4, 1 + k]) for k in range(3))
        + "".join(str(grid[1 + k, 0]) for k in range(3))
        + "".join(str(grid[1 + k, 4]) for k in range(3))
    )
    return cells + ring


def rotate(sig: str, quarter_turns: int = 1) -> str:
    grid = _to_grid(sig)
    for _ in range(quarter_turns % 4):
        grid = np.rot90(grid, -1)   # clockwise
    return _from_grid(grid)


def rotations(sig: str) -> list[str]:
    """The four rotations (no reflections) of a signature."""
    return [rotate(sig, k) for k in range(4)]
