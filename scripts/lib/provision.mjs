// Provisioning, as a decision rather than a side effect.
//
// The account's current state is an input, so "what is missing" is a pure
// function of the registry and that state: running it twice converges, and a
// half-finished run leaves a state that the next run completes. Nothing here
// talks to Cloudflare; `applyPlan` takes the client as an argument.

import { resolveTarget, TargetNotImplemented } from './targets.mjs';

// The Target table's descriptions for every entry, in registry order, with no
// account state involved. This is what the CLI prints when asked to change
// nothing.
export function describeProvisioning(entries) {
  assertEntries(entries);

  const { targets, skipped } = divide(entries);

  return {
    descriptions: targets.map(({ entry, target }) => ({
      slug: entry.slug,
      steps: [target.provision(entry), target.attachDomain(entry)],
    })),
    skipped,
  };
}

// What still has to happen, given what the account already has.
//
// `state` is `{ projects: { [name]: { domains: string[] } } }` — the shape the
// Pages client returns. A missing project yields both steps; an existing one
// yields a domain step only when the hostname is not attached.
export function provisioningPlan(entries, state) {
  assertEntries(entries);

  const { targets, skipped } = divide(entries);
  const projects = state?.projects ?? {};
  const steps = [];

  for (const { entry, target } of targets) {
    const existing = projects[entry.project];

    if (existing === undefined) {
      steps.push(target.provision(entry), target.attachDomain(entry));
      continue;
    }

    const domain = target.attachDomain(entry);
    const attached = Array.isArray(existing.domains) ? existing.domains : [];
    if (!attached.includes(domain.domain)) steps.push(domain);
  }

  return { steps, skipped };
}

// Performs the plan in order: every create precedes the attach that follows it.
export async function applyPlan(steps, client) {
  if (!Array.isArray(steps)) throw new TypeError('applyPlan: steps must be an array');
  if (client === null || typeof client !== 'object') {
    throw new TypeError('applyPlan: client must be an object');
  }

  const applied = [];

  for (const step of steps) {
    if (step.kind === 'create-project') {
      await client.createProject(step.project);
    } else if (step.kind === 'attach-domain') {
      await client.attachDomain(step.project, step.domain);
    } else {
      throw new Error(`applyPlan: unknown step "${step.kind}"`);
    }
    applied.push(step);
  }

  return applied;
}

// The one rule both callers share: an entry either has a target that can
// describe work, or it is reported and left alone.
function divide(entries) {
  const targets = [];
  const skipped = [];

  for (const entry of entries) {
    const resolution = resolve(entry);
    if (resolution.skipped !== undefined) skipped.push(resolution.skipped);
    else targets.push({ entry, target: resolution.target });
  }

  return { targets, skipped };
}

function resolve(entry) {
  try {
    return { target: resolveTarget(entry) };
  } catch (error) {
    if (error instanceof TargetNotImplemented) {
      return {
        skipped: { slug: error.slug, target: error.target, reason: error.message },
      };
    }
    throw error;
  }
}

function assertEntries(entries) {
  if (!Array.isArray(entries)) throw new TypeError('entries must be an array');
}
