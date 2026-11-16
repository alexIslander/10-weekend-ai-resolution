#!/usr/bin/env node
// The Dashboard's build entrypoint. Thin adapter over buildDashboard(): argv
// and console output live here, the build does not.
//
//   node 08-dashboard/build.mjs            -> 08-dashboard/dist
//   node 08-dashboard/build.mjs --out DIR  -> DIR

import { relative } from 'node:path';

import { buildDashboard } from './src/build.mjs';

const argv = process.argv.slice(2);

try {
  const outDir = destination(argv);
  const { files, view } = buildDashboard(outDir === null ? {} : { outDir });
  const where = relative(process.cwd(), files[0]);

  console.log(
    `dashboard: ${view.tiles.length} Tiles, ${view.services.length} Service links -> ${where}`,
  );
} catch (error) {
  console.error(`dashboard: ${error.message}`);
  process.exitCode = 1;
}

function destination(args) {
  if (args.length === 0) return null;

  if (args[0] === '--out') {
    if (args[1] === undefined || args[1].startsWith('--')) {
      throw new Error('--out needs a directory');
    }
    return args[1];
  }

  if (args[0].startsWith('--out=')) return args[0].slice('--out='.length);

  throw new Error(`unknown argument "${args[0]}" (usage: build.mjs [--out DIR])`);
}
