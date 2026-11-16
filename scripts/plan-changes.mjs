#!/usr/bin/env node
// Thin adapter over plan(): argv and git live here, the decision does not.
//
//   node scripts/plan-changes.mjs --changed <path>...
//   node scripts/plan-changes.mjs [--base origin/main] [--ref refs/heads/main]
//
// With no --changed, the paths come from `git diff --name-only <base>..HEAD`.
// Prints the deploy matrix as JSON and nothing else.
//
// The registry is read, not validated: `scripts/validate-apps.mjs` is the gate
// for registry shape, and an App whose folder does not exist yet must not stop
// the planner from being run.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { plan } from './lib/plan.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

main(process.argv.slice(2));

function main(argv) {
  let result;
  try {
    const options = parseArgs(argv);
    const changedPaths =
      options.changed.length > 0 ? options.changed : changedSince(options.base, root);
    const trigger =
      options.ref === undefined ? { kind: 'push' } : { kind: 'push', ref: options.ref };

    result = plan({ entries: readEntries(join(root, 'apps.json')), changedPaths, trigger });
  } catch (error) {
    console.error(`plan-changes: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

function parseArgs(argv) {
  const parsed = { changed: [], base: 'origin/main', ref: undefined };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--changed') {
      while (argv[i + 1] !== undefined && !argv[i + 1].startsWith('--')) {
        i += 1;
        parsed.changed.push(argv[i]);
      }
    } else if (arg.startsWith('--changed=')) {
      parsed.changed.push(arg.slice('--changed='.length));
    } else if (arg === '--base') {
      i += 1;
      parsed.base = valueOf(argv, i, '--base');
    } else if (arg.startsWith('--base=')) {
      parsed.base = arg.slice('--base='.length);
    } else if (arg === '--ref') {
      i += 1;
      parsed.ref = valueOf(argv, i, '--ref');
    } else if (arg.startsWith('--ref=')) {
      parsed.ref = arg.slice('--ref='.length);
    } else {
      throw new Error(`unknown argument "${arg}"`);
    }
  }

  return parsed;
}

function valueOf(argv, index, flag) {
  const value = argv[index];
  if (value === undefined || value.startsWith('--')) {
    throw new Error(`${flag} needs a value`);
  }
  return value;
}

function changedSince(base, cwd) {
  const output = execFileSync('git', ['diff', '--name-only', `${base}..HEAD`], {
    cwd,
    encoding: 'utf8',
  });
  return output.split('\n').filter(Boolean);
}

function readEntries(path) {
  return JSON.parse(readFileSync(path, 'utf8')).entries;
}
