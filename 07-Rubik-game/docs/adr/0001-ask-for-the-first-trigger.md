# Ask for the first trigger, not the full formula

Practising position recognition means one decision: which trigger do I apply
here. The game therefore asks a four-option question — S, AS, ET, WT — and the
four options are always the same four, shuffled, so there are no distractors to
pick and a fixed 25% guess floor. The alternatives (composing answer strings
like `U → AS`, or a free-text route) were rejected for the basic modes because
they test typing as much as recognition.

Naming a whole route is a separate mode (`Route`), not a longer version of the
same question; see ADR-0002.

## Consequences

- The guess floor is beaten by scoring, not by trick options: streak multiplier
  over the run, and a `Test` run that gives nothing away.
- AUF turns are not part of the answer in the basic modes. Answering them is
  the `AUF` mode.
