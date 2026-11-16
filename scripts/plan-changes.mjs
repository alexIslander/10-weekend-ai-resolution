#!/usr/bin/env node
// Thin adapter over plan(): argv and git live here, the decision does not.
//
//   node scripts/plan-changes.mjs --changed <path>...
//   node scripts/plan-changes.mjs [--base origin/main] [--ref refs/heads/main]
//   node scripts/plan-changes.mjs --app <slug|all> [--stage staging|production] [--ref REF]
//
// With no --changed, the paths come from `git diff --name-only <base>..HEAD`.
// --app asks a manual question instead: this App, or every App. Its stage is
// whatever --stage says, defaulting to the stage the ref implies, so a manual
// run and a push cannot disagree about what `main` means (ADR-0002).
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
import { stageFor } from './lib/stage.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

main(process.argv.slice(2));

function main(argv) {
  let result;
  try {
    const options = parseArgs(argv);
    const entries = readEntries(join(root, 'apps.json'));

    if (options.app !== undefined) {
      result = plan({
        entries,
        trigger: {
          kind: 'manual',
          app: options.app,
          stage: options.stage ?? stageFor(options.ref),
        },
      });
    } else {
      const changedPaths =
        options.changed.length > 0 ? options.changed : changedSince(options.base, root);
      const trigger =
        options.ref === undefined ? { kind: 'push' } : { kind: 'push', ref: options.ref };

      result = plan({ entries, changedPaths, trigger });
    }
  } catch (error) {
    console.error(`plan-changes: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

function parseArgs(argv) {
  const parsed = {
    changed: [],
    base: 'origin/main',
    ref: undefined,
    app: undefined,
    stage: undefined,
  };

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
    } else if (arg === '--app') {
      i += 1;
      parsed.app = valueOf(argv, i, '--app');
    } else if (arg.startsWith('--app=')) {
      parsed.app = arg.slice('--app='.length);
    } else if (arg === '--stage') {
      i += 1;
      parsed.stage = valueOf(argv, i, '--stage');
    } else if (arg.startsWith('--stage=')) {
      parsed.stage = arg.slice('--stage='.length);
    } else if (arg === '--ref') {
      i += 1;
      parsed.ref = valueOf(argv, i, '--ref');
    } else if (arg.startsWith('--ref=')) {
      parsed.ref = arg.slice('--ref='.length);
    } else {
      throw new Error(`unknown argument "${arg}"`);
    }
  }

  if (parsed.app === undefined && parsed.stage !== undefined) {
    throw new Error('--stage only means something with --app');
  }
  if (parsed.app !== undefined && parsed.changed.length > 0) {
    throw new Error('--app and --changed ask different questions; pick one');
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
