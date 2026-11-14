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

**AUF**:
An *adjust upper face* turn (`U`, `U'`, `U2`) made between two steps to line
the next trigger up. Belongs to a route, not to a step.
_Avoid_: Setup, adjustment, pre-move

**Group**:
One of the 14 headings the booklet sorts positions under (`T-Shapes`,
`Lightning Bolts`, …). Every position belongs to exactly one group.
_Avoid_: Family, category, class

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

**Priority**:
A position's rank inside an `Adaptive` run — how much it is worth practising
next, judged from the player's record of it.
_Avoid_: Difficulty, weight, score

### Records

**Player**:
A name a run's score is attributed to. Anyone typing the name becomes that
player; nothing is proved.
_Avoid_: User, account, profile

**Board**:
The ranked list of finished runs for one mode at one hint level.
_Avoid_: Leaderboard, ranking, highscore table
