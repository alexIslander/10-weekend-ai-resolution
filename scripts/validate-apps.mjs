#!/usr/bin/env node
// Thin CLI over the registry module: load, validate, print one line per
// problem, exit non-zero if there are any.

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadRegistry } from './lib/registry.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const path = join(root, 'apps.json');

try {
  const entries = loadRegistry(path, root);
  console.log(`apps.json: ${entries.length} entries, all valid`);
} catch (error) {
  const [summary, ...problems] = error.message.split('\n');
  if (problems.length === 0) console.error(summary);
  else for (const problem of problems) console.error(problem);
  process.exitCode = 1;
}
