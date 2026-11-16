// Where one App deploys to, decided here rather than in YAML: the stage, the
// target and the target table's description of the work. Building is
// lib/build.mjs's job, so neither module has to know the other's convention.

import { branchOf, stageFor } from './stage.mjs';
import { resolveTarget } from './targets.mjs';

export function describeDeploy({ entries, slug, ref } = {}) {
  if (!Array.isArray(entries)) throw new TypeError('describeDeploy: entries must be an array');

  const entry = entries.find((candidate) => candidate.slug === slug);
  if (entry === undefined) throw new Error(`describeDeploy: unknown App "${slug}"`);

  const stage = stageFor(ref);

  // Resolution first: an unimplemented target stops here, before any build.
  const target = resolveTarget(entry);

  // Staging needs the branch under test; production is always `main`, and the
  // target table applies that rule, not the caller (ADR-0006).
  const deploy = target.deploy(entry, stage, branchOf(ref));

  return {
    slug: entry.slug,
    kind: entry.kind,
    stage,
    target: entry.target,
    project: deploy.project,
    branch: deploy.branch,
    dir: deploy.dir,
  };
}
