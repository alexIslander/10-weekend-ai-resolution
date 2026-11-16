// The change -> App mapping, as one pure function.
//
// In:  { entries, changedPaths, trigger }
// Out: { deploy: [{ slug, stage }], skipped: [{ slug, reason }] }
//
// Every entry appears exactly once across the two arrays, so a caller never has
// to guess why an App is missing from the matrix.
//
// trigger is { kind: 'push', ref? } or { kind: 'manual', app, stage }.
// `ref` is optional because a local run has no ref; absent means staging, which
// is the safe default (ADR-0002).

import { stageFor } from './stage.mjs';

const STAGES = ['staging', 'production'];
const REGISTRY_FILES = ['apps.json'];
const REGISTRY_PREFIXES = ['scripts/', '.github/workflows/'];

export function plan({ entries, changedPaths = [], trigger } = {}) {
  if (!Array.isArray(entries)) throw new TypeError('plan: entries must be an array');
  if (trigger === null || typeof trigger !== 'object') {
    throw new TypeError('plan: a trigger is required');
  }

  if (trigger.kind === 'manual') return planManual(entries, trigger);
  if (trigger.kind === 'push') return planPush(entries, changedPaths, trigger);
  throw new TypeError(`plan: unknown trigger kind "${trigger.kind}"`);
}

function planManual(entries, trigger) {
  const stage = trigger.stage;
  if (!STAGES.includes(stage)) {
    throw new Error(`plan: a manual trigger needs a stage, one of ${STAGES.join(', ')}`);
  }

  const slugsToDeploy =
    trigger.app === 'all'
      ? new Set(entries.map((entry) => entry.slug))
      : new Set([requireSlug(entries, trigger.app)]);

  return partition(entries, slugsToDeploy, stage, () => 'not requested by the manual trigger');
}

function planPush(entries, changedPaths, trigger) {
  if (!Array.isArray(changedPaths)) {
    throw new TypeError('plan: changedPaths must be an array');
  }

  const paths = changedPaths.map(normalisePath).filter(Boolean);
  const slugsToDeploy = paths.some(isRegistryPath)
    ? new Set(withBuild(entries).map((entry) => entry.slug))
    : matchedSlugs(entries, paths);

  return partition(entries, slugsToDeploy, stageFor(trigger.ref), (entry) =>
    `no changed path under ${entry.build.dir}`,
  );
}

// One row per entry, so deploy and skipped together account for the registry.
function partition(entries, slugsToDeploy, stage, reasonForSkipped) {
  const deploy = [];
  const skipped = [];

  for (const entry of entries) {
    if (slugsToDeploy.has(entry.slug) && hasBuild(entry)) {
      deploy.push({ slug: entry.slug, stage });
    } else {
      skipped.push({
        slug: entry.slug,
        reason: hasBuild(entry)
          ? reasonForSkipped(entry)
          : `target ${entry.target} has no build: not deployable from this repo`,
      });
    }
  }

  return { deploy, skipped };
}

// Longest build.dir wins, which is what keeps `05-MyLifeOps/admin` from also
// deploying `05-MyLifeOps`. Ties fall to registry order.
function matchedSlugs(entries, paths) {
  const candidates = withBuild(entries).map((entry) => ({
    slug: entry.slug,
    dir: normalisePath(entry.build.dir),
  }));

  const matched = new Set();
  for (const path of paths) {
    let best;
    for (const candidate of candidates) {
      if (!isUnder(path, candidate.dir)) continue;
      if (best === undefined || candidate.dir.length > best.dir.length) best = candidate;
    }
    if (best !== undefined) matched.add(best.slug);
  }
  return matched;
}

function isUnder(path, dir) {
  return path === dir || path.startsWith(`${dir}/`);
}

function isRegistryPath(path) {
  return (
    REGISTRY_FILES.includes(path) ||
    REGISTRY_PREFIXES.some((prefix) => path.startsWith(prefix))
  );
}

function hasBuild(entry) {
  return entry.build != null;
}

function withBuild(entries) {
  return entries.filter(hasBuild);
}

function requireSlug(entries, app) {
  const entry = entries.find((candidate) => candidate.slug === app);
  if (entry === undefined) throw new Error(`plan: unknown app "${app}"`);
  return entry.slug;
}

function normalisePath(path) {
  return String(path)
    .replace(/^\.\//, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
}
