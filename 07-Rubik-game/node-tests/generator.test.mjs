/**
 * The generator is the only way to change the position data, so its reading of
 * the booklet is under test too — without the booklet, where possible.
 *
 * Run with: node --test
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { buildCases, readGroups } from "../scripts/generate-cases.mjs";

const BOOKLET = fileURLToPath(new URL("../../06-Rubik/", import.meta.url));
const bookletAvailable =
  existsSync(`${BOOKLET}tests/fixtures/oll_routes.json`) && existsSync(`${BOOKLET}minimal-without-flows-print.html`);

const printGuide = `
<h1>Minimal OLL Step List</h1>
<div class="minimal-row"><div class="minimal"><strong>0. Minimal Formula Collection</strong></div></div>
    <h2>T-Shapes</h2>
    <div class="pair">
        <table class="case"><tr><td class="art"><img src="img/friedrich-oll-9.png" alt="OLL 33"></td></tr></table>
        <table class="case"><tr><td class="art"><img src="img/friedrich-oll-19.png" alt="OLL 45"></td></tr></table>
    </div>
    <h2>Squares</h2>
    <div class="pair">
        <table class="case"><tr><td class="art"><img src="img/friedrich-oll-4.png" alt="OLL 5"></td></tr></table>
    </div>
`;

test("reads the group headings in booklet order, with the positions printed under each", () => {
  assert.deepEqual(readGroups(printGuide), [
    { name: "T-Shapes", olls: [33, 45], images: ["img/friedrich-oll-9.png", "img/friedrich-oll-19.png"] },
    { name: "Squares", olls: [5], images: ["img/friedrich-oll-4.png"] },
  ]);
});

test("the guide's own title is not a group", () => {
  assert.ok(readGroups(printGuide).every(({ name }) => name !== "Minimal OLL Step List"));
});

test("a position keeps the diagram the guide prints for it, not one named after its OLL number", () => {
  const [tShapes] = readGroups(printGuide);
  assert.equal(tShapes.images[0], "img/friedrich-oll-9.png");
  assert.notEqual(tShapes.images[0], `img/friedrich-oll-${tShapes.olls[0]}.png`);
});

test(
  "the committed file is exactly what the booklet generates",
  { skip: bookletAvailable ? false : "06-Rubik is not checked out next to this project" },
  () => {
    const committed = JSON.parse(readFileSync(new URL("../app/src/quiz/entity/cases.json", import.meta.url), "utf8"));
    assert.deepEqual(buildCases(), committed, "cases.json drifted from the booklet: regenerate and commit the diff");
  }
);
