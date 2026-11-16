#!/usr/bin/env node
// What the deploy workflow reads, per App. Argv and the registry live here; the
// decision is describeDeploy()'s.
//
//   node scripts/describe-deploy.mjs --slug rubik --ref refs/heads/main
//
// Prints one JSON object and exits non-zero with a message when the App is
// unknown, its target is not implemented, or a staging run cannot name the
// branch it deploys.

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describeDeploy } from './lib/deploy.mjs';
import { loadRegistry } from './lib/registry.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

main(process.argv.slice(2));

function main(argv) {
  let described;
  try {
    const options = parseArgs(argv);
    const entries = loadRegistry(join(root, 'apps.json'), root);
    described = describeDeploy({
      entries,
      slug: options.slug,
      ref: options.ref,
    });
  } catch (error) {
    console.error(`describe-deploy: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  process.stdout.write(`${JSON.stringify(described, null, 2)}\n`);
}

function parseArgs(argv) {
  const parsed = { slug: undefined, ref: undefined };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--slug') {
      i += 1;
      parsed.slug = valueOf(argv, i, '--slug');
    } else if (arg.startsWith('--slug=')) {
      parsed.slug = arg.slice('--slug='.length);
    } else if (arg === '--ref') {
      i += 1;
      parsed.ref = valueOf(argv, i, '--ref');
    } else if (arg.startsWith('--ref=')) {
      parsed.ref = arg.slice('--ref='.length);
    } else {
      throw new Error(`unknown argument "${arg}"`);
    }
  }

  if (parsed.slug === undefined) throw new Error('--slug is required');
  if (parsed.ref === undefined) throw new Error('--ref is required');

  return parsed;
}

function valueOf(argv, index, flag) {
  const value = argv[index];
  if (value === undefined || value.startsWith('--')) {
    throw new Error(`${flag} needs a value`);
  }
  return value;
}
