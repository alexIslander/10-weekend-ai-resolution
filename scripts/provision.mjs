#!/usr/bin/env node
// Provisioning entrypoint. Argv, environment and network live here; the
// decision about what is missing lives in lib/provision.mjs.
//
//   node scripts/provision.mjs            descriptions only, nothing touched
//   node scripts/provision.mjs --plan     what is missing from the account
//   node scripts/provision.mjs --apply    create the missing projects, attach
//                                         the missing hostnames
//
// --plan and --apply need CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in the
// environment. See docs/deploy-credentials.md for the scopes they must carry.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { pagesClient } from './lib/pages-client.mjs';
import {
  applyPlan,
  describeProvisioning,
  provisioningPlan,
} from './lib/provision.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

main(process.argv.slice(2)).catch((error) => {
  console.error(`provision: ${error.message}`);
  process.exitCode = 1;
});

async function main(argv) {
  const mode = parseArgs(argv);
  const entries = readEntries(join(root, 'apps.json'));

  if (mode === 'describe') {
    print(describeProvisioning(entries));
    return;
  }

  const client = pagesClient({
    token: requireEnv('CLOUDFLARE_API_TOKEN'),
    accountId: requireEnv('CLOUDFLARE_ACCOUNT_ID'),
  });

  const state = await client.readState();
  const plan = provisioningPlan(entries, state);

  if (mode === 'plan') {
    print(plan);
    return;
  }

  const applied = await applyPlan(plan.steps, client);
  print({ ...plan, applied: applied.length });
}

function parseArgs(argv) {
  if (argv.length === 0) return 'describe';

  const [flag, ...rest] = argv;
  if (rest.length > 0) throw new Error(`unexpected argument "${rest[0]}"`);

  if (flag === '--plan') return 'plan';
  if (flag === '--apply') return 'apply';

  throw new Error(`unknown argument "${flag}" (usage: provision.mjs [--plan|--apply])`);
}

function requireEnv(name) {
  const value = process.env[name];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${name} is not set — see docs/deploy-credentials.md`);
  }
  return value.trim();
}

function readEntries(path) {
  return JSON.parse(readFileSync(path, 'utf8')).entries;
}

function print(result) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
