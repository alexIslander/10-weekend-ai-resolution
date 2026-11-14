# Tickets

The build broken into tracer bullets, published as sub-issues of spec #2 and labelled
`ready-for-agent`. Blocking edges are native GitHub issue dependencies.

| # | Ticket | Blocked by | Delivers |
| --- | --- | --- | --- |
| 3 | App shell, generated position data, single-position drill | — | Template running without bookmarks, committed position file + images, one position answerable and revealed |
| 4 | A scored Random run | #3 | Name prompt, 57-position run, streak ladder, finish screen |
| 5 | Runs persist, boards appear | #4 | Reload keeps records; board per mode × hint level |
| 6 | Mode picker, hint level, Grouped and Progressive | #5 | Three modes, group picker, Training/Test |
| 7 | Stats page: weak spots, per-group accuracy, reset and delete | #6 | Per-mode and per-group accuracy, worst-10 drills, totals |
| 8 | Route mode: name the whole sequence | #6 | Chips + submit, all-or-nothing |
| 9 | AUF mode: setup turn and trigger | #6 | Two-part answer, `none` valid |
| 10 | Adaptive mode: worst positions first | #6, #7 | Priority ordering, weak-spots button |

Frontier: **#3** alone. #8 and #9 are independent of each other and can be worked in
either order once #6 lands; #10 needs #7 because the weak-spots button lives there.
