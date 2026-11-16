# The game ships a generated `cases.json`, not a dependency on 06-Rubik

`06-Rubik/tests/fixtures/oll_routes.json` already holds 57 positions with a
correctly mapped image, step count and route — but not the booklet's 14 group
names, which exist only in the print HTML. A generator in `scripts/` reads both
and writes one committed `cases.json` into the game.

The alternative — importing the fixture at runtime — would couple the game to a
sibling project's test fixture, which is free to move or change shape. The
generated file is a snapshot: to pick up a change in `06-Rubik`, re-run the
generator and commit the diff, which also makes that change reviewable.

## Consequences

- No runtime or build dependency between `07-Rubik-game` and `06-Rubik`.
- The group names stop being trapped inside an HTML file.
- `cases.json` is data, not code: it must not be hand-edited.
- PLL is out of scope for now, and needs the image mapping fixed first —
  `pll_cases.json` names `friedrich-pll-NN.png` files that do not exist.
