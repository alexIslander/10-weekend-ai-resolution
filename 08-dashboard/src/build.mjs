// Build the Dashboard's deployable folder from the committed registry.
//
// The registry is read and validated here, at build time, and the page is
// rendered as static HTML: the shipped folder holds a document and a
// stylesheet, no data file and no client script. That is what keeps the deploy
// fields and any credential structurally out of the public bundle (ADR-0003).

import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadRegistry } from '../../scripts/lib/registry.mjs';
import { renderPage } from './render.mjs';
import { dashboardView } from './view-model.mjs';

export const dashboardDir = join(dirname(fileURLToPath(import.meta.url)), '..');

export function buildDashboard({
  root = join(dashboardDir, '..'),
  outDir = join(dashboardDir, 'dist'),
} = {}) {
  // Validation first: a registry problem must stop the build, not ship a page.
  const entries = loadRegistry(join(root, 'apps.json'), root);
  const view = dashboardView(entries);
  const page = renderPage(view);

  mkdirSync(outDir, { recursive: true });

  const index = join(outDir, 'index.html');
  const stylesheet = join(outDir, 'style.css');
  writeFileSync(index, page);
  copyFileSync(join(dashboardDir, 'src', 'page.css'), stylesheet);

  return { outDir, files: [index, stylesheet], view, entries: entries.length };
}
