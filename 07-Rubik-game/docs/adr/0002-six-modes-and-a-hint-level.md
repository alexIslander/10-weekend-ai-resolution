# Six modes, two independent axes, stats from the first run

Modes differ only in *which positions a run draws and in what order*: `Random`,
`Grouped`, `Progressive`, `Route`, `AUF`, `Adaptive`. How much the screen gives
away is a second, independent axis — `Training` or `Test` — because a one-step
position at `Training` and a three-step position at `Test` are both legitimate
things to practise, and collapsing the two axes made "easy mode" mean two
different things.

`Route` and `AUF` change the *question*, not just the order; they are still
modes because everything else about a run (scoring, board, stats, hint level)
is identical.

`Adaptive` ships last because it is the only mode with an algorithm, but every
run records per-position stats from the first ticket, so `Adaptive` and the
stats page have history to read on the day they are built.

## Consequences

- Run length equals the mode's pool: a `Random` or `Adaptive` run is 57
  questions, one group is that group's size. This keeps scores comparable and
  stops a player dodging the positions they fear.
- An abandoned run is discarded; only a finished run reaches a board.
- Wrong answers are revealed and the run moves on. There is no re-queue — that
  is what `Adaptive` and the stats page are for.
