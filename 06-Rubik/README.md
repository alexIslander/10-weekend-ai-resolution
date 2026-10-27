# 06-Rubik — OLL guides

Two HTML guides for the "minimal OLL" method, plus `img/` with one flat
diagram per OLL case. `oll-algorithms.pdf` (Zemdegs / Klise) is the reference:
it defines every case's name, standard OLL number, and diagram.

- `oll-full-guide.html` — jump style: one trigger, then "go to case X".
- `minimal-without-flows.html` — one flat list per case: every step, no jumps.

Both guides group the cases exactly as the PDF does — the same 14 headings
("T-Shapes", "Squares", "P-Shapes", "Lightning Bolts", ...) in the same printed
order, rows read left to right — and label every row with the PDF's own case
name (`T1`, `P3`, `B6`, `OCLL6`). Each guide opens with an index that links to
the groups, so a case can be found by its PDF name or its OLL number.

The step column is colour-coded by the trigger the case starts with, so a
position can be recognised by the tool it needs first:

| Tool | Abbrev. | Default colour |
| --- | --- | --- |
| Sune | S | `#d9534f` |
| Anti-Sune | AS | `#f0ad4e` |
| Edge Trigger | ET | `#5cb85c` |
| Wide Edge Trigger | WT | `#4a9fd8` |

The palette is a parameter, not a copy-paste: each colour lives in one CSS
variable (`--tool-s`, `--tool-as`, `--tool-et`, `--tool-wt`) and every step cell
carries the trigger it opens with (`<td data-tool="et">`), so changing a
variable repaints every row that starts with that trigger. The toolbox has a
colour picker per trigger for the same job live in the browser, remembered in
`localStorage`; the tag itself is derived from the step text by
`tools/step_tools.py`, so an edited flow cannot keep a stale colour.

Both columns are simulation-verified: each route was replayed on a 3x3 model
whose positions reproduce all 57 PDF diagrams exactly. Every case solves in at
most 3 triggers from the four-trigger toolbox, with the AUF turns spelled out.
Clicking any diagram opens that exact position in a cube simulator
(alg.cubing.net) with the solution preloaded.

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
.venv/bin/python -m tools.step_tools --check           # step-column colour tags
.venv/bin/python -m tools.step_tools --write           # retag after editing a flow
.venv/bin/python -m tools.pdf_ground_truth tests/fixtures/oll_cases.json
.venv/bin/python -m tools.render_diagram              # redraw the diagrams
```

`--check` exits non-zero when a row shows the wrong image or a guide drifts from
the PDF's groups or printed order, so it works as a pre-commit or CI guard for any
future edit to these guides.

## Layout

- `tools/signature.py` — diagram signature, face detection, rotations.
- `tools/pdf_ground_truth.py` — PDF → cases + signatures → fixture, and the
  PDF's group headings with their case numbers in printed order.
- `tools/oll_refs.py` — mapping, audit, grouping check, repair, CLI.
- `tools/step_tools.py` — tags each step cell with the trigger it starts with.
- `tools/render_diagram.py` — draws the diagrams from the PDF signatures.
- `tests/test_refs.py` — reference and artwork integrity tests.
- `tests/test_step_tools.py` — step-column colour tags and palette wiring.
- `tests/fixtures/file_to_case.json` — which OLL case each image file shows.

## Published site

The guides are published to GitHub Pages by `.github/workflows/rubik-pages.yml`
on every push to `feature/06-rubik` (or `main`) that touches `06-Rubik/`:

- https://alexislander.github.io/10-weekend-ai-resolution/

Only the two guides, `index.html` and the reference PDF are assembled into the
site; `index.html` is the landing page that links to both guides. `tools/`,
`tests/` and this README stay out of the published artifact.
