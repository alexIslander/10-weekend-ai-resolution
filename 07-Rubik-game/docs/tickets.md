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
| 12 | Design system, shell and theme | — | New two-theme tokens, vendored icon module, tri-state theme applied before first paint, colour bar + sticky header + nav pills + one max-width container; every screen renders on the new tokens |
| 13 | Dashboard home | #12 | `/` is a dashboard: open run first, then a card per mode with accuracy and finished-run badge, picker expanding inside the chosen card, name in the header |
| 14 | Skip an open run | #13 | Skip from the dashboard card and from the run header, a confirm that names what is lost, record snapshot/restore so a skipped run leaves no trace, "started 3 weeks ago" decay |
| 15 | Play surfaces restyled | #12, #13 | Question card, white diagram sticker, neutral answer chips, green-check/red-cross verdicts, yellow reveal note, finish, stats and scores on `.card` |
| 16 | Elapsed time from play, not the wall clock | #13, #14 | Answer time accumulated in the run; the finish screen and the board tie-break read it, so a resumed run no longer carries its downtime |
| 17 | Docs and e2e pass | #13, #14, #15, #16 | README rewritten (dashboard, skip, theme), spec navigation pointing at ADR-0006, all specs green on `data-testid` hooks, light and dark screenshots |

Frontier: **#12**. It lands before #9–#11: the dashboard needs tiles for modes
that do not ship yet (their colours and glyphs are fixed by ADR-0006), and every
e2e spec is invalidated once, in #12–#15, rather than twice.

Deferred behind the redesign: #9 AUF and #10 Adaptive (the stats page makes the
weak-spots button possible, and both modes already have their dashboard card
designated), then #11 keyboard answering — its `1`–`4` mapping is unchanged but
its focus assertions ride on the restyled answer chips.
