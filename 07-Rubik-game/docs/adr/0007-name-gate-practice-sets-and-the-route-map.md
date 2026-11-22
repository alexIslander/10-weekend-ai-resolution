# The first visit is asked for a name, practice sets have six positions, and Route shows its map

The live game (`https://rubik-game.csete.cc/`) met its first real player and
came back with six complaints: a new visitor is never asked for a name; once
asked, the field stays open over the dashboard; nothing on the dashboard says
how a run works or what S, AS, ET and WT stand for; `Grouped` offers groups of
two positions, which is a lookup and not a drill; and `Route` asks for a
sequence of two or three triggers from a single diagram, which is invisible
work until it is wrong. This ADR records the five decisions behind the fix.

## The name gate

A first arrival used to meet a dashboard whose only identity control was a small
`change` link in the header. `/` now opens a modal `<dialog>` — "what should we
call you?" — whenever the page loads with no name, with the field focused, an
empty name refused, and `later` for the player who wants to look first. A name
that is already stored never shows it. `later` is not a trap: the hero keeps an
"add your name" button, and the header keeps its field, both of which reopen the
gate.

A `<dialog>` rather than a styled overlay, because the browser already has
modality: the backdrop, the focus trap, and `Escape`. The gate's field is
uncontrolled and read on submit, so typing a name is one store change instead
of one per keystroke and the dialog cannot re-render under the keyboard.

## The name field is a moment

With a name in the store, the header said `playing as ada` **and** kept an input
containing `ada` — two statements of the same fact, and a field that never went
away. The field now replaces the line while it is open (no duplicate), and
closes on `Enter`, on leaving it with a name typed, and on `done`. An empty
field stays open: closing it would leave nothing where the identity was.

## The dashboard teaches before it asks

Two folded cards sit under the mode cards: **how the game works** (position,
trigger, step/route, practice set, Training/Test, scoring) and **the four
triggers** (code, name, formula, what it does, and a link to
`https://rubik.csete.cc/`). Both open by themselves on a first visit — a player
with no finished runs and no answers — and fold away once there is history;
`<details>` keeps them one tap away after that. Each mode card also states the
rule it plays by (`all 57, shuffled`, `one practice set`, …), so the picker
answers "what would this ask me?" before it is tapped. Rejected: a separate
`/how-it-works` route, which hides the answer one navigation from the question,
and a permanent wall of prose above the modes, which pushes the first action
off a phone screen.

## Grouped draws practice sets, not booklet groups

`Grouped` offered the booklet's 14 headings, six of which hold two positions.
It now offers **practice sets**: the headings walked in booklet order, filled
until a set holds six positions, and never split inside a heading. Today that is
eight sets — 7, 6, 8, 8, 8, 6, 6, 8 — and the pairs are neighbouring headings
(`T-Shapes · Squares · C-Shapes`). A set of one heading keeps that heading's
name; a set of several names them all, because the booklet has no family name
for the pairing and inventing one would be vocabulary the reader cannot look up.

The sets are derived from the committed position file on every render, not
stored: a change in the booklet changes the picker, and the tests assert the
eight sizes. A short tail — impossible in today's booklet, possible in the next
— folds into the set before it rather than standing alone. Rejected: keeping
the 14 groups and letting the player pair them by hand, and grouping by first
trigger, which is what Route now does.

## Route is cut into first-step lanes, and shows its map

Two changes, both from the booklet's route map
(`06-Rubik/oll-route-map-first-step.html`):

**Lanes.** `Route` offers `All positions` or one lane per first trigger —
`S` 12, `AS` 8, `ET` 18, `WT` 19, the counts the guide prints. A lane is
practice on one opening, and the counts are asserted in the browser-free tests.

**The map.** The generated position data now carries the shape each step lands
on (`shape`, the OLL number, or 0 for solved; plus the booklet's `warn` flag),
copied from the route fixture. The run screen draws the route as a chain above
the answer: an empty box per trigger, the checkpoint diagram between them, and
the solved badge at the end. The boxes stay empty until `submit`, then fill with
the route and its AUF turns. The map says how many steps there are; the triggers
are still the player's to name, and the answer is still judged whole.

At `Training` each checkpoint is labelled with its case name; at `Test` it is a
picture and nothing else, keeping ADR-0002's rule that nothing identifying is on
screen before the answer. The booklet's checkpoints are recognition aids, not
shortcuts — a shape is a pattern, not a state — so the `warn` marker (a lane
with fewer steps left than that shape's own row needs) is surfaced at Training,
which is where jumping to the row would mislead.

This gives away two things the old screen withheld: the step count and the
intermediate shapes. That is the point — a two-step route from one diagram was
the mode's whole difficulty, and the mode is meant to drill the sequence, not the
memory of the map. The reveal still teaches the route, turns included.

## Consequences

- `cases.json` is regenerated and carries `route[].shape` / `route[].warn`; the
  generator and `assert-cases.mjs` refuse a chain that does not end solved.
- Boards do not change: a Route lane still lands on the Route board for its hint
  level, and a filtered Grouped run still lands on the Grouped board, exactly as
  runs of different groups always have (ADR-0004). A board compares scores, not
  pool sizes; if that ever matters, it is its own ADR.
- The e2e suite gained a shared `support.js` (the gate covers every screen, so
  every spec must get past it) and a `ux.spec.js` for the dashboard's teaching
  and the Route map.
- The 14 booklet headings stay in the data: the reveal still names them, and the
  stats page still rolls accuracy up over all 14. Only the picker's unit changed.
