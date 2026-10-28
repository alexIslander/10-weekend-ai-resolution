"""Build the ground-truth fixture from the reference PDF.

The PDF ("OLL Algorithms", Zemdegs/Klise) is the authority for which case is
which, and what it looks like. Each case block on the page is a diagram image
with its label printed beside it at the same height:

    [3x3 diagram]   R U2 R' U' R U' R'
                    y' R' U' R U' R' U2 R
                    OCLL6 - 26 - Probability = 1/54

so a case is recovered as (name, oll number, diagram), pairing image and label
by nearest vertical position within the same column. The algorithm the PDF
prints first above that label ("Suggested algorithm here" in the format legend)
is captured too: it is the one-step formula, while the second line is only an
alternative.

Run with:

    .venv/bin/python -m tools.pdf_ground_truth tests/fixtures/oll_cases.json
"""

from __future__ import annotations

import io
import json
import re
import sys
from pathlib import Path

import pymupdf
from PIL import Image

from .signature import detect_face, signature

PDF_PATH = Path(__file__).resolve().parent.parent / "oll-algorithms.pdf"

# "OCLL6 - 26 - Probability = 1/54": case name, standard OLL number, probability.
LABEL_WORDS = 5
NAME_RE = re.compile(r"^[A-Z]{1,4}\d?$")
COLUMN_SPLIT_X = 300      # page is two columns of case blocks
DIAGRAM_MAX_WIDTH = 300   # wider images are headers/legends, not diagrams
LEGEND_MAX_Y = 350        # on page 1 the format legend sits above this
PDF_DPI = 250


def _labels(words: list[tuple]) -> list[tuple[float, float, str, int]]:
    """Find "NAME - NUMBER - Probability" word groups: (x, y, name, number)."""
    words = sorted(words, key=lambda w: (round(w[1]), w[0]))
    found = []
    index = 0
    while index < len(words) - LABEL_WORDS + 1:
        name, dash_a, number, dash_b, probability = words[index:index + LABEL_WORDS]
        if (
            NAME_RE.match(name[4])
            and dash_a[4] == "-"
            and number[4].isdigit()
            and dash_b[4] == "-"
            and probability[4].startswith("Probability")
            and abs(name[1] - probability[1]) < 3
        ):
            found.append((name[0], name[1], name[4], int(number[4])))
            index += LABEL_WORDS
        else:
            index += 1
    return found


# An algorithm line is printed in cube notation: moves, rotations, and round
# brackets used to segment them. Case labels and prose never match this.
ALG_RE = re.compile(r"^[()\[\]'\sURFDLBMESudlrfbxyz0-9w]+$")
ALG_MOVE_RE = re.compile(r"[URFDLBMESudlrfbxyz]")
LABEL_RE = re.compile(r"^[A-Z]{1,4}\d? - \d+ - Probability")


def _algorithm_lines(page) -> list[tuple[float, float, str]]:
    """Every algorithm line on the page: (x, y, text), top to bottom."""
    found = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"]).strip()
            if not text or LABEL_RE.match(text) or not ALG_RE.match(text):
                continue
            if not ALG_MOVE_RE.search(text):
                continue
            x, y = line["bbox"][0], line["bbox"][1]
            found.append((x, y, re.sub(r"\s+", " ", text)))
    return found


def suggested_algorithm(label_y: float, column: int,
                        algs: list[tuple[float, float, str]],
                        previous_y: float) -> str | None:
    """The formula the PDF prints first between the previous label and this one."""
    between = [
        (y, text) for x, y, text in algs
        if _column(x) == column and previous_y < y < label_y
    ]
    return min(between)[1] if between else None


# Group headings ("T-Shapes", "Lightning Bolts", ...) are the only 12pt bold lines.
HEADING_FONT = "Verdana-Bold"
HEADING_SIZE = 12.0
SAME_ROW_Y = 20           # labels of one printed row sit within this many points


def _column(x: float) -> int:
    return 0 if x < COLUMN_SPLIT_X else 1


def extract_cases(pdf_path: Path = PDF_PATH) -> list[dict]:
    """Return 57 case dicts: name, oll, page, png (bytes), signature."""
    doc = pymupdf.open(pdf_path)
    cases = []
    for page_number, page in enumerate(doc):
        labels = _labels(page.get_text("words"))
        algs = _algorithm_lines(page)
        diagrams = [i for i in page.get_image_info(xrefs=True) if i["width"] < DIAGRAM_MAX_WIDTH]
        if page_number == 0:
            diagrams = [i for i in diagrams if i["bbox"][1] > LEGEND_MAX_Y]
        for column in (0, 1):
            column_labels = sorted(
                [l for l in labels if _column(l[0]) == column], key=lambda l: l[1]
            )
            column_diagrams = sorted(
                [d for d in diagrams
                 if _column((d["bbox"][0] + d["bbox"][2]) / 2) == column],
                key=lambda d: d["bbox"][1],
            )
            if len(column_labels) != len(column_diagrams):
                raise ValueError(
                    f"page {page_number} column {column}: "
                    f"{len(column_labels)} labels for {len(column_diagrams)} diagrams"
                )
            previous = 0.0
            for label, diagram in zip(column_labels, column_diagrams):
                pixmap = page.get_pixmap(clip=pymupdf.Rect(diagram["bbox"]), dpi=PDF_DPI)
                png = pixmap.tobytes("png")
                art = Image.open(io.BytesIO(png))
                cases.append(
                    {
                        "name": label[2],
                        "oll": label[3],
                        "page": page_number,
                        "alg": suggested_algorithm(label[1], column, algs, previous),
                        "png": png,
                        "signature": signature(art, detect_face(art)),
                    }
                )
                previous = label[1]
    return cases


def _headings(page) -> list[tuple[float, str]]:
    found = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            for span in line["spans"]:
                if (
                    span["font"] == HEADING_FONT
                    and abs(span["size"] - HEADING_SIZE) < 0.5
                    and span["text"].strip()
                ):
                    found.append((span["bbox"][1], span["text"].strip()))
    return sorted(found)


def _printed_order(labels: list[tuple]) -> list[tuple]:
    """Labels in reading order: rows top to bottom, each row left to right."""
    rows: list[list[tuple]] = []
    for label in sorted(labels, key=lambda l: l[1]):
        if rows and abs(label[1] - rows[-1][0][1]) < SAME_ROW_Y:
            rows[-1].append(label)
        else:
            rows.append([label])
    return [label for row in rows for label in sorted(row, key=lambda l: l[0])]


def extract_groups(pdf_path: Path = PDF_PATH) -> list[tuple[str, list[int]]]:
    """Return [(group heading, [OLL numbers in printed order])] from the PDF."""
    groups: list[tuple[str, list[tuple]]] = []
    for page in pymupdf.open(pdf_path):
        headings = _headings(page)
        if not headings:
            continue
        buckets: list[list] = [[text, []] for _, text in headings]
        for label in _labels(page.get_text("words")):
            above = [i for i, (y, _) in enumerate(headings) if y <= label[1]]
            if above:
                buckets[above[-1]][1].append(label)
        groups.extend((title, labels) for title, labels in buckets)
    return [
        (title, [label[3] for label in _printed_order(labels)])
        for title, labels in groups
    ]


def build_fixture(cases: list[dict]) -> list[dict]:
    return [
        {
            "oll": c["oll"],
            "name": c["name"],
            "page": c["page"],
            "alg": c["alg"],
            "signature": c["signature"],
        }
        for c in sorted(cases, key=lambda c: c["oll"])
    ]


def main(argv: list[str]) -> int:
    out = Path(argv[1]) if len(argv) > 1 else Path("tests/fixtures/oll_cases.json")
    cases = extract_cases()
    numbers = sorted(c["oll"] for c in cases)
    if numbers != list(range(1, 58)):
        print(f"expected OLL 1..57, got {len(numbers)} cases: {numbers}", file=sys.stderr)
        return 1
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(build_fixture(cases), indent=1) + "\n")
    print(f"wrote {out} with {len(cases)} cases")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
