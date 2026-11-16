#!/usr/bin/env node
// Build one App, by the convention in lib/build.mjs, so no workflow YAML has to
// know how any App builds.
//
//   node scripts/build-app.mjs --slug lit-starter
//
// An App whose build folder is already the artifact prints that and does
// nothing; an App that needs a build prints each command before running it.

import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildPlan } from './lib/build.mjs';
import { loadRegistry } from './lib/registry.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

main(process.argv.slice(2));

function main(argv) {
  let plan;
  let slug;

  try {
    slug = parseSlug(argv);
    const entries = loadRegistry(join(root, 'apps.json'), root);
    const entry = entries.find((candidate) => candidate.slug === slug);
    if (entry === undefined) throw new Error(`unknown App "${slug}"`);
    plan = buildPlan(entry, root);
  } catch (error) {
    console.error(`build-app: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  if (plan.steps.length === 0) {
    console.log(`build-app: ${slug} needs no build; ${plan.cwd} is the artifact`);
    return;
  }

  const cwd = join(root, plan.cwd);
  for (const command of plan.steps) {
    console.log(`build-app: ${command}  (in ${plan.cwd})`);
    execFileSync('sh', ['-c', command], { cwd, stdio: 'inherit' });
  }
}

function parseSlug(argv) {
  if (argv.length === 2 && argv[0] === '--slug') return argv[1];
  if (argv.length === 1 && argv[0].startsWith('--slug=')) return argv[0].slice('--slug='.length);
  throw new Error('usage: build-app.mjs --slug <App Slug>');
}
