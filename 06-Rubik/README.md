# 06-Rubik — OLL guides

Three HTML guides for the "minimal OLL" method, plus `img/` with one flat
diagram per OLL case. `oll-algorithms.pdf` (Zemdegs / Klise) is the reference:
it defines every case's name, standard OLL number, and diagram.

## Image references

`img/friedrich-oll-NN.png` is **not** OLL case NN. The art was exported in a
different order (mostly the reference sheet's presentation order with the pairs
swapped), so a guide that points `OLL n` at `friedrich-oll-n.png` shows the wrong
picture for almost every case.

The mapping is recovered from the artwork, not from the filenames:

- every diagram is read into a 21-character signature — 9 top-face stickers plus
  a 12-sticker ring of side stickers, yellow = oriented;
- a file is matched to the case whose PDF signature is identical under one of
  the four rotations (never a mirror: mirror twins are different cases).

Result: 57 files, 57 cases, one to one — no case is missing an image, and no
image is unused. `tests/fixtures/oll_cases.json` holds the PDF ground truth
(57 cases: name, OLL number, signature).

## The diagrams

The diagrams are drawn from the PDF ground truth by `tools/render_diagram.py`,
because the original art could not distinguish cases that differ only in edge
orientation: it carried the 12 side stickers as 1-pixel slivers at the canvas
edge, so 14 pairs of cases (Sune/Anti-Sune among them) rendered pixel-identical.

Each diagram now shows:

- the 3x3 face — amber = oriented, white = not;
- the ring of 12 side stickers — amber = that edge is oriented, grey = it is not.

`tests/fixtures/file_to_case.json` records which case each file shows, so
redrawing never renumbers the folder, and `tests/test_refs.py` fails if any two
diagrams become indistinguishable again.

## Commands

Requires a local virtualenv with `pymupdf`, `pillow`, `pytest`:

```sh
python3 -m venv .venv
.venv/bin/pip install pymupdf pillow pytest
```

Then, from `06-Rubik/`:

```sh
.venv/bin/python -m pytest tests -q                    # verify references
.venv/bin/python -m tools.oll_refs --check             # same audit, CLI form
.venv/bin/python -m tools.oll_refs --mapping           # file -> OLL case table
.venv/bin/python -m tools.oll_refs --write             # rewrite wrong references
.venv/bin/python -m tools.pdf_ground_truth tests/fixtures/oll_cases.json
.venv/bin/python -m tools.render_diagram              # redraw the diagrams
```

`--check` exits non-zero when a row shows the wrong image, so it works as a
pre-commit or CI guard for any future edit to these guides.

## Layout

- `tools/signature.py` — diagram signature, face detection, rotations.
- `tools/pdf_ground_truth.py` — PDF → cases + signatures → fixture.
- `tools/oll_refs.py` — mapping, audit, repair, CLI.
- `tools/render_diagram.py` — draws the diagrams from the PDF signatures.
- `tests/test_refs.py` — reference and artwork integrity tests.
- `tests/fixtures/file_to_case.json` — which OLL case each image file shows.
