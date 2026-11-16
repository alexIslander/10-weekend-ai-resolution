# A skipped run is discarded, not half-recorded

An open run can be skipped at any moment. Skipping withdraws everything that run
gave to the player: its answers leave the per-position records, so weak spots,
group accuracy and lifetime totals only ever count finished runs. This is the
promise `docs/spec.md` already made in story 29 ("an abandoned run to be
discarded rather than half-recorded, so that the boards stay honest") — it is
recorded here because the implementation choices below are not obvious from the
code.

## Consequences

- The open run carries a snapshot of its player's position records taken when it
  started; skipping restores that snapshot. Without the snapshot, withdrawal
  would have to know which answers belonged to which run.
- Forty answered positions are thrown away when a long run is skipped, and
  `Adaptive` priority loses that evidence. Accepted: the alternative is a stats
  page that moves after a run the player has explicitly discarded.
- A finished run is never affected. Discard is a property of `Open run` only.
