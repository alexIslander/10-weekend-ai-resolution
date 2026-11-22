# Rubik Game

The OLL trigger-recognition game: a player is shown a cube position and names
the trigger that solves it. The language below is the booklet's language in
`06-Rubik/`, narrowed to what the game needs.

## Language

### Positions and routes

**Position**:
One of the 57 OLL cases, identified by its diagram — the top face plus the ring
of side stickers.
_Avoid_: Case, pattern, state, situation

**Case name**:
The booklet's label for a position plus its OLL number (`K2`, `P4`,
`OCLL6 (Anti-Sune)`).
_Avoid_: Name, identifier

**Trigger**:
One of the four formulas that apply as a single step: Sune (S), Anti-Sune (AS),
Edge Trigger (ET), Wide Edge Trigger (WT).
_Avoid_: Formula, algorithm, tool (those name the booklet's broader toolbox, of which the triggers are one part)

**Step**:
One application of a trigger. A position takes one, two, or three steps.
_Avoid_: Move, turn, stage

**Route**:
The ordered steps that solve a position from its diagram, e.g.
`AS → WT → S`.
_Avoid_: Solution, sequence, algorithm

**Route map**:
The chain a Route question draws above the answer: one box per step, the
checkpoint shape between them, and the solved badge at the end. It says how many
steps there are; the triggers are still the player's to name.
_Avoid_: Diagram, chain (say route map), flow

**AUF**:
An *adjust upper face* turn (`U`, `U'`, `U2`) made between two steps to line
the next trigger up. Belongs to a route, not to a step.
_Avoid_: Setup, adjustment, pre-move

**Group**:
One of the 14 headings the booklet sorts positions under (`T-Shapes`,
`Lightning Bolts`, …). Every position belongs to exactly one group. The reveal
and the stats page use it; a `Grouped` run does not draw one directly.
_Avoid_: Family, category, class

**Practice set**:
What a `Grouped` run draws: one group, or several neighbouring groups, holding
at least six positions (`T-Shapes · Squares · C-Shapes`). The booklet's groups
are filled in order until a set has six, and a group is never split between two
sets.
_Avoid_: Group (that is the booklet's heading), category, bundle

**First-step lane**:
What a `Route` run can draw instead of all 57: every position whose route opens
with one trigger (`Starts with Sune (S)`, 12 positions). The booklet's route map
cuts the same lanes.
_Avoid_: Group, filter, subset

**Checkpoint**:
The shape a route is in after one of its steps, drawn in the Route map between
one trigger and the next and named by its OLL number. A checkpoint is a pattern,
not a state: the same picture can need a different follow-up, which is what the
booklet's `warn` marks.
_Avoid_: Intermediate, stage, substep

### Playing

**Mode**:
The rule that produces the sequence of positions in a run.
_Avoid_: Mode is not a difficulty level: see *hint level*

**Hint level**:
How much a run gives away: `Training` shows the case name while asking,
`Test` shows nothing identifying until the answer. Every mode runs at either
hint level.
_Avoid_: Easy mode, hard mode, difficulty (both axes were once called "easy")

**Training**:
A hint level: the case name and OLL number are visible with the position.
_Avoid_: Easy, practice, beginner

**Test**:
A hint level: only the diagram is visible until the answer is given.
_Avoid_: Hard, exam, quiz, blind

**Run**:
One play of a mode from the first position to the last, ending in one score.
_Avoid_: Game, session, round

**Open run**:
A run that has started but not reached its last position: it has no score, it
lands on no board, and it is waiting to be continued or skipped.
_Avoid_: Unfinished game, saved game, session, resume point

**Skip**:
To discard an `open run`. It leaves no trace: the answers it collected are taken
back out of the player's records, and nothing about it is ever scored.
_Avoid_: Abandon, quit, cancel, forfeit, stop

**Drill**:
A run of one position, started from a `weak spot`: the question is asked at
`Test` and the answer is recorded, but no board ranks its score.
_Avoid_: Practice run, retry, single run

**Weak spot**:
A position the player has answered and sits among the lowest accuracies of.
_Avoid_: Weak position, problem case

**Priority**:
A position's rank inside an `Adaptive` run — how much it is worth practising
next, judged from the player's record of it.
_Avoid_: Difficulty, weight, score

### Records

**Player**:
A name a run's score is attributed to. Anyone typing the name becomes that
player; nothing is proved. A first visit is asked for one in the name gate, and
`later` leaves the page readable without it.
_Avoid_: User, account, profile

**Name gate**:
The modal dialog a page load with no stored name opens. It can be put off, and
the dashboard and header both reopen it.
_Avoid_: Login, signup, onboarding

**Board**:
The ranked list of finished runs for one mode at one hint level.
_Avoid_: Leaderboard, ranking, highscore table
