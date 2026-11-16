// How an entry's folder becomes the artifact that gets uploaded.
//
// One convention, in one module, so no workflow YAML knows any App's build:
//
//   <build.dir>/package.json  -> npm ci (or npm install without a lockfile),
//                                then npm run build, which must exist
//   <build.dir>/build.mjs     -> node build.mjs
//   neither                   -> nothing to build; build.dir is already the
//                                artifact (the static guides and the game)
//
// Adding an App that fits a convention needs no workflow edit and no registry
// change; adding one that does not is a new convention here, deliberately.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function buildPlan(entry, root = process.cwd()) {
  const dir = entry?.build?.dir;
  if (typeof dir !== 'string' || dir.trim() === '') {
    throw new TypeError('buildPlan: entry.build.dir is required');
  }

  const has = (file) => existsSync(join(root, dir, file));

  if (has('package.json')) {
    requireBuildScript(entry, root, dir);
    const install = has('package-lock.json') ? 'npm ci' : 'npm install';
    return { cwd: dir, steps: [install, 'npm run build'] };
  }

  if (has('build.mjs')) {
    return { cwd: dir, steps: ['node build.mjs'] };
  }

  return { cwd: dir, steps: [] };
}

function requireBuildScript(entry, root, dir) {
  const manifest = JSON.parse(readFileSync(join(root, dir, 'package.json'), 'utf8'));
  const script = manifest?.scripts?.build;
  if (typeof script !== 'string' || script.trim() === '') {
    throw new Error(
      `buildPlan: ${entry.slug} has a package.json with no build script, so nothing would produce build.out`,
    );
  }
}
