"""A sticker-level 3x3 model, enough to prove a simulator link is right.

The guides link to alg.cubing.net with a `setup` (the state to show) and an
`alg` (what to run from it). Getting those two wrong is invisible in the HTML
and obvious in the browser, so the link is checked here instead: build the cube,
apply the setup, ask whether the last layer is on top, apply the algorithm, ask
whether the cube is solved.

Nothing is assumed about notation direction. Every face turn is a -90 degree
rotation about that face's outward axis (clockwise seen from outside), which is
the definition; wide turns, slices and whole-cube rotations are built from it.
"""

from __future__ import annotations

import re
from typing import Iterable

Vec = tuple[int, int, int]

UP: Vec = (0, 1, 0)
FACE_NORMALS = {
    "U": (0, 1, 0),
    "D": (0, -1, 0),
    "F": (0, 0, 1),
    "B": (0, 0, -1),
    "R": (1, 0, 0),
    "L": (-1, 0, 0),
}

TOKEN_RE = re.compile(r"([URFDLBMESudlrfbxyzXYZ])(w?)(2'|2|'|’)?")


def _rotate(vector: Vec, axis: str, quarter_turns: int) -> Vec:
    """Rotate `vector` about a coordinate axis in quarter turns (right-handed)."""
    x, y, z = vector
    for _ in range(quarter_turns % 4):
        if axis == "x":
            x, y, z = x, -z, y
        elif axis == "y":
            x, y, z = z, y, -x
        else:
            x, y, z = -y, x, z
    return (x, y, z)


def _face_move(face: str, quarter_turns: int) -> tuple[str, set[int], int]:
    """(axis, layers, quarter turns) for a clockwise turn of `face`."""
    axis = "xyz"["RUF".index(face)] if face in "RUF" else "xyz"["LDB".index(face)]
    layer = {"R": 1, "L": -1, "U": 1, "D": -1, "F": 1, "B": -1}[face]
    # Clockwise seen from outside a +face is -90 about its axis; a -face is +90.
    turns = -1 if layer > 0 else 1
    return axis, {layer}, turns


def _move(letter: str, suffix: str) -> tuple[str, set[int], int] | None:
    """Resolve notation to (axis, layers, quarter turns); None for rotations."""
    wide = letter.islower() and letter in "rudflb"
    name = letter.upper()

    if letter.lower() in "xyz":
        axis = letter.lower()
        layers = {-1, 0, 1}
        turns = -1
    elif name in "MES":
        axis, layers, turns = {
            "M": ("x", {0}, 1),      # as L, through the middle
            "E": ("y", {0}, 1),      # as D
            "S": ("z", {0}, -1),     # as F
        }[name]
    elif wide:
        axis, layers, turns = _face_move(name, 1)
        layers = layers | {0}
    else:
        axis, layers, turns = _face_move(name, 1)

    if suffix == "'":
        turns = -turns
    elif suffix in ("2", "2'"):
        turns *= 2
    return axis, layers, turns


def solved() -> dict[tuple[Vec, Vec], str]:
    """Six faces of nine stickers: {(position, normal): face letter}."""
    cube = {}
    for face, normal in FACE_NORMALS.items():
        spanned = [i for i, value in enumerate(normal) if value == 0]
        for a in (-1, 0, 1):
            for b in (-1, 0, 1):
                position = list(normal)
                position[spanned[0]] = a
                position[spanned[1]] = b
                cube[(tuple(position), normal)] = face
    return cube


def apply_alg(cube: dict[tuple[Vec, Vec], str], alg: str) -> dict[tuple[Vec, Vec], str]:
    """The cube after performing every move in `alg`, brackets ignored."""
    for letter, _wide, suffix in TOKEN_RE.findall(alg):
        move = _move(letter, suffix)
        if move is None:
            continue
        axis, layers, turns = move
        turned = {}
        index = "xyz".index(axis)
        for (position, normal), face in cube.items():
            if position[index] in layers:
                turned[(_rotate(position, axis, turns), _rotate(normal, axis, turns))] = face
            else:
                turned[(position, normal)] = face
        cube = turned
    return cube


def is_solved(cube: dict[tuple[Vec, Vec], str]) -> bool:
    return all(FACE_NORMALS[face] == normal for (_, normal), face in cube.items())


def last_layer_on_top(cube: dict[tuple[Vec, Vec], str], face: str = "U") -> bool:
    """Every sticker of `face` is facing up: the case is shown from above."""
    return all(normal == UP for (_, normal), colour in cube.items() if colour == face)


def inverse_alg(alg: str) -> str:
    """The move sequence that undoes `alg`."""
    tokens = [f"{letter}{w}{suffix}" for letter, w, suffix in TOKEN_RE.findall(alg)]
    inverted = []
    for token in reversed(tokens):
        match = TOKEN_RE.fullmatch(token)
        letter, wide, suffix = match.group(1), match.group(2), match.group(3) or ""
        if suffix in ("2", "2'"):
            inverted.append(f"{letter}{wide}2")
        elif suffix:
            inverted.append(f"{letter}{wide}")
        else:
            inverted.append(f"{letter}{wide}'")
    return " ".join(inverted)


def normalising_rotations(cube: dict[tuple[Vec, Vec], str], face: str = "U",
                          depth: int = 3) -> str:
    """Shortest whole-cube rotation sequence that puts `face` on top."""
    candidates = ["x", "x2", "x'", "y", "y2", "y'", "z", "z2", "z'"]
    sequences = [""]
    for _ in range(depth):
        sequences = [f"{prefix} {token}".strip() for prefix in sequences for token in candidates]
        for sequence in sequences:
            if last_layer_on_top(apply_alg(dict(cube), sequence), face):
                return sequence
    return ""
