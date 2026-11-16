// What the Dashboard renders, derived from the Apps Registry and nothing else.
//
// One pure function: entries in, ordered Tiles and ordered Service links out.
// The Tile view is the registry module's, so this file cannot decide to show a
// field the registry does not consider a Tile field — `target`, `project` and
// `build` are dropped before the page ever sees them (ADR-0003).

import { tileView } from '../../scripts/lib/registry.mjs';

export function dashboardView(entries) {
  if (!Array.isArray(entries)) {
    throw new TypeError('dashboardView: entries must be an array');
  }

  const view = { tiles: [], services: [] };

  for (const entry of entries) {
    if (entry.kind === 'app') {
      view.tiles.push(tileView(entry));
    } else {
      const { title, url } = tileView(entry);
      view.services.push({ title, url });
    }
  }

  return view;
}
