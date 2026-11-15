// The Deploy Target table: one adapter per target, describing work rather than
// doing it. Nothing here shells out to wrangler or touches an API.
//
// Only `pages` is implemented. `workers` and `aws` throw TargetNotImplemented
// from resolveTarget() — one place — so an unimplemented path fails loudly at
// the plan step instead of quietly provisioning the wrong thing. That is what
// makes ADR-0005 executable: an AWS origin can never be handed a Pages project.

import { posix } from 'node:path';

import { hostnameFor } from './registry.mjs';

export class TargetNotImplemented extends Error {
  constructor(entry) {
    super(
      `target "${entry.target}" is not implemented: ${entry.slug} is not deployed from this repo yet`,
    );
    this.name = 'TargetNotImplemented';
    this.slug = entry.slug;
    this.target = entry.target;
  }
}

export function resolveTarget(entry) {
  if (entry === null || typeof entry !== 'object') {
    throw new TypeError('resolveTarget: entry must be an object');
  }

  switch (entry.target) {
    case 'pages':
      return pagesTarget;
    case 'workers':
    case 'aws':
      throw new TargetNotImplemented(entry);
    default:
      throw new Error(`resolveTarget: "${entry.slug}" has unknown target "${entry.target}"`);
  }
}

// provision(entry)          -> create the project
// provision(entry, 'domain')-> attach the App's hostname to it
// Both are descriptions; whoever runs them decides the order.
const pagesTarget = Object.freeze({
  provision(entry, step = 'project') {
    if (step === 'domain') {
      return {
        kind: 'attach-domain',
        project: entry.project,
        domain: domainOf(entry),
      };
    }
    return { kind: 'create-project', project: entry.project };
  },

  // `branch` is the Pages branch alias: `main` for production, and the branch
  // under test for staging, which the caller supplies because this module has
  // no access to the working copy.
  deploy(entry, stage = 'staging', branch = stage === 'production' ? 'main' : null) {
    return {
      kind: 'pages-deploy',
      dir: artifactDir(entry),
      project: entry.project,
      branch,
    };
  },
});

function artifactDir(entry) {
  return posix.join(entry.build.dir, entry.build.out);
}

function domainOf(entry) {
  return new URL(hostnameFor(entry)).host;
}
