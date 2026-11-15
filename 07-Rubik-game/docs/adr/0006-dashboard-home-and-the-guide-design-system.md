# The dashboard is home, dressed in the solve guide's design language

The play screen was the home screen, so a returning player met a form and could
not see what the app knew about them. `/` is now a dashboard: the `Open run`
first, then one card per `Mode`, each showing the player's accuracy for it; the
name lives in the sticky header; choosing a mode expands its hint level, group
and start inside the same card, so the picker survives without a second route.

The visual language is taken from `docs/design/rubik_s_cube_8_step_solve_guide.html`
(the booklet it drills, restyled): `--rubik-*` cube colours, `--bg-*`/`--text-*`
semantic tokens with a `[data-theme="dark"]` block, a 6-colour bar, a CSS 3×3
logo, nav pills, `.card` surfaces, and the booklet's badges — green check, red
cross, yellow "solving note". The old `--color-*` tokens are deleted rather than
aliased, and the template's `body{width:80%}` + `main` grid + container queries
give way to one `max-width` container.

## Theme

Three states, cycling **Auto → Light → Dark**, Auto by default, stored under a
key of its own (`rubik-theme`) rather than in the store, and applied by an
inline `<head>` script before first paint. A store slice would paint white
first, because the store only hydrates with the module graph; a separate key
also survives `reset stats` and `delete player`. Rejected: a two-state toggle
(as in the reference document) — it cannot honour "too white at 6 a.m." without
being touched.

## Icons

Font Awesome Free, but vendored: the path data for the ~14 icons actually used
(theme states, player, continue, skip, verdicts, one badge per mode) lives in
`app/src/icons.js`, not behind the cdnjs `all.min.css` and its webfonts. The
repo already vendors `lit-html`; ~14 paths are smaller than the CSS that would
fetch them, work offline, and keep the no-bundler rule. Type is the one asset
left on a CDN — Inter and JetBrains Mono from Google Fonts — because subsetting
webfonts by hand is a liability, and the fallback to `system-ui` degrades
quietly.

## Consequences

- Four specs of e2e selectors are invalidated at once; the redesign introduces
  `data-testid` hooks so the next visual change is not.
- `Progressive`, `Route`, `Adaptive` and `AUF` cards are coloured and glyphed now,
  even for modes that do not ship yet, so the grid never reshuffles.
- Offline, icons still render (vendored) but the type falls back.
