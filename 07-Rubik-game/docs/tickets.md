# Tickets

The build broken into tracer bullets, published as sub-issues of spec #2 and labelled
`ready-for-agent`. Blocking edges are native GitHub issue dependencies.

| # | Ticket | Blocked by | Delivers |
| --- | --- | --- | --- |
| 3 | App shell, generated position data, single-position drill | — | Template running without bookmarks, committed position file + images, one position answerable and revealed |
| 4 | A scored Random run | #3 | Name prompt, 57-position run, streak ladder, finish screen |
| 5 | Runs persist, boards appear | #4 | Reload keeps records; board per mode × hint level |
| 6 | Mode picker, hint level, Grouped and Progressive | #5 | Three modes, group picker, Training/Test |
| 7 | Stats page: weak spots, per-group accuracy, reset and delete | #6 | Per-mode and per-group accuracy, worst-10 drills, totals — **done** |
| 8 | Route mode: name the whole sequence | #6 | Chips + submit, all-or-nothing — **done** |
| 9 | AUF mode: setup turn and trigger | #6 | Two-part answer, `none` valid |
| 10 | Adaptive mode: worst positions first | #6, #7 | Priority ordering, weak-spots button |
| 11 | Keyboard answering | after #10 | Keys 1–4 answer, focus moves to next, Enter advances |

Frontier: **#9** and **#10** (after #3–#8 landed): the AUF mode, and the
Adaptive mode whose weak-spots button the stats page now makes possible. #11 is a deliberate addition after the plan: keyboard answering was listed
as out of scope in `spec.md`, and the game is better with it — it is sequenced last so
the modes and stats keep priority.
