// The Deploy Target table: one adapter per target, describing work rather than
// doing it. Nothing here shells out to wrangler or touches an API.
//
// Only `pages` is implemented. `workers` and `aws` throw TargetNotImplemented
// from resolveTarget() — one place — so an unimplemented path fails loudly at
// the plan step instead of quietly provisioning the wrong thing. That is what
// makes ADR-0005 executable: an AWS origin can never be handed a Pages project.

import { posix } from 'node:path';

import { hostnameFor } from './registry.mjs';

const STAGES = ['staging', 'production'];

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

// Two provisioning steps, each a description; whoever runs them decides the
// order and the retries.
const pagesTarget = Object.freeze({
  provision(entry) {
    return { kind: 'create-project', project: entry.project };
  },

  attachDomain(entry) {
    return {
      kind: 'attach-domain',
      project: entry.project,
      domain: domainOf(entry),
    };
  },

  // `branch` is the Pages branch alias. Production is always `main`; staging is
  // the branch under test (ADR-0002), which the caller supplies because this
  // module has no access to the working copy — and which is required, so a
  // staging deploy can never be described without the hostname it will land on.
  deploy(entry, stage, branch) {
    if (!STAGES.includes(stage)) {
      throw new Error(
        `deploy: stage must be one of ${STAGES.join(', ')}, got "${stage}"`,
      );
    }
    const target = stage === 'production' ? 'main' : branch;
    if (typeof target !== 'string' || target.trim() === '') {
      throw new Error('deploy: a staging deploy needs the branch under test');
    }

    return {
      kind: 'pages-deploy',
      dir: artifactDir(entry),
      project: entry.project,
      branch: target,
    };
  },
});

function artifactDir(entry) {
  return posix.join(entry.build.dir, entry.build.out);
}

function domainOf(entry) {
  return new URL(hostnameFor(entry)).host;
}
