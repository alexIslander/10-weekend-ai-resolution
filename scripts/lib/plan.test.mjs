// The change -> App mapping, tested against the real registry.
//
// The case that shapes this file is nesting: `05-MyLifeOps/admin` sits inside
// `05-MyLifeOps`, so a naive `startsWith` would deploy both from one admin edit.
// Those tests are fixtures, because the real registry has no MyLifeOps entries
// yet (MyLifeOps is its own spec).

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { plan } from './plan.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const realEntries = () =>
  JSON.parse(readFileSync(join(repoRoot, 'apps.json'), 'utf8')).entries;

const onPush = (changedPaths, ref) =>
  plan({
    entries: realEntries(),
    changedPaths,
    trigger: ref === undefined ? { kind: 'push' } : { kind: 'push', ref },
  });

const onManual = (app, stage = 'staging') =>
  plan({ entries: realEntries(), changedPaths: [], trigger: { kind: 'manual', app, stage } });

const slugs = (rows) => rows.map((row) => row.slug);
const deployOf = (result) => result.deploy;

const buildableSlugs = (entries) =>
  entries.filter((entry) => entry.build != null).map((entry) => entry.slug);

// --- push: one changed path, one App -----------------------------------------

const singleAppCases = [
  { path: '08-dashboard/src/main.js', slug: 'apps' },
  { path: '01-lit-starter/src/index.js', slug: 'lit-starter' },
  { path: '02-lit-admin-starter/vite.config.js', slug: 'admin-starter' },
  { path: '06-Rubik/index.html', slug: 'rubik' },
  { path: '06-Rubik/tools/asset.html', slug: 'rubik' },
  { path: '07-Rubik-game/app/src/main.js', slug: 'rubik-game' },
  { path: '00-dualreveal/src/app.ts', slug: 'dualreveal' },
  { path: '06-Rubik', slug: 'rubik' },
];

for (const { path: changedPath, slug } of singleAppCases) {
  test(`a push touching ${changedPath} deploys only ${slug}`, () => {
    assert.deepEqual(deployOf(onPush([changedPath])), [{ slug, stage: 'staging' }]);
  });
}

test('a push touching nothing deployable deploys nothing', () => {
  const result = onPush(['README.md', 'docs/adr/0001-flat-hostnames-under-csete-cc.md']);
  assert.deepEqual(result.deploy, []);
  assert.equal(result.skipped.length, realEntries().length);
});

test('a folder whose name starts with another folder name does not match it', () => {
  // 06-Rubik-game is not under 06-Rubik; a prefix test without the separator
  // would deploy both.
  const result = onPush(['07-Rubik-game/app/src/main.js']);
  assert.deepEqual(slugs(deployOf(result)), ['rubik-game']);
});

test('the same path twice deploys its App once', () => {
  const result = onPush(['06-Rubik/index.html', '06-Rubik/oll-full-guide.html']);
  assert.deepEqual(deployOf(result), [{ slug: 'rubik', stage: 'staging' }]);
});

// --- push: stage -------------------------------------------------------------

const stageCases = [
  { ref: undefined, stage: 'staging' },
  { ref: 'feature/deploy-pipeline', stage: 'staging' },
  { ref: 'refs/heads/feature/deploy-pipeline', stage: 'staging' },
  { ref: 'main', stage: 'production' },
  { ref: 'refs/heads/main', stage: 'production' },
];

for (const { ref, stage } of stageCases) {
  test(`a push with ref ${ref ?? '(none)'} deploys at ${stage}`, () => {
    const result = onPush(['06-Rubik/index.html'], ref);
    assert.deepEqual(deployOf(result), [{ slug: 'rubik', stage }]);
  });
}

// --- push: registry-level changes -------------------------------------------

const registryPaths = ['apps.json', 'scripts/lib/plan.mjs', '.github/workflows/deploy.yml'];

for (const registryPath of registryPaths) {
  test(`a change to ${registryPath} deploys every buildable entry`, () => {
    const entries = realEntries();
    const result = onPush([registryPath]);
    assert.deepEqual(slugs(deployOf(result)), buildableSlugs(entries));
  });
}

test('a registry change still leaves entries with no build in skipped', () => {
  const result = onPush(['apps.json']);
  const noBuild = realEntries().filter((entry) => entry.build === undefined);
  assert.equal(noBuild.length, 3);
  for (const entry of noBuild) {
    const row = result.skipped.find((skip) => skip.slug === entry.slug);
    assert.ok(row, `${entry.slug} missing from skipped`);
    assert.match(row.reason, /no build/);
  }
});

test('a registry change wins over a path that matches one App', () => {
  const result = onPush(['apps.json', '06-Rubik/index.html']);
  assert.deepEqual(slugs(deployOf(result)), buildableSlugs(realEntries()));
});

// --- push: the nested-directory fixture -------------------------------------

const nestedEntries = [
  {
    slug: 'mylifeops',
    kind: 'app',
    target: 'pages',
    project: 'mylifeops',
    build: { dir: '05-MyLifeOps', out: 'dist' },
    live: false,
  },
  {
    slug: 'mylifeops-admin',
    kind: 'app',
    target: 'pages',
    project: 'mylifeops-admin',
    build: { dir: '05-MyLifeOps/admin', out: 'dist' },
    live: false,
  },
  {
    slug: 'spring-api',
    kind: 'service',
    target: 'aws',
    url: 'https://spring-api.csete.cc',
    live: false,
  },
];

const nestedPush = (changedPaths) =>
  plan({ entries: nestedEntries, changedPaths, trigger: { kind: 'push' } });

test('a change inside the nested folder deploys only the nested App', () => {
  assert.deepEqual(slugs(deployOf(nestedPush(['05-MyLifeOps/admin/dist/index.html']))), [
    'mylifeops-admin',
  ]);
});

test('a change outside the nested folder deploys only the parent App', () => {
  assert.deepEqual(slugs(deployOf(nestedPush(['05-MyLifeOps/src/main.ts']))), ['mylifeops']);
});

test('a change touching both folders deploys both Apps', () => {
  const result = nestedPush(['05-MyLifeOps/admin/index.html', '05-MyLifeOps/src/main.ts']);
  assert.deepEqual(slugs(deployOf(result)).sort(), ['mylifeops', 'mylifeops-admin']);
});

test('a registry edit deploys every buildable fixture entry and skips the rest', () => {
  const result = plan({
    entries: nestedEntries,
    changedPaths: ['apps.json'],
    trigger: { kind: 'push' },
  });

  assert.deepEqual(deployOf(result), [
    { slug: 'mylifeops', stage: 'staging' },
    { slug: 'mylifeops-admin', stage: 'staging' },
  ]);
  assert.deepEqual(slugs(result.skipped), ['spring-api']);
});

// --- manual ------------------------------------------------------------------

test('a manual deploy of one App deploys it at the given stage', () => {
  const result = onManual('rubik', 'production');
  assert.deepEqual(deployOf(result), [{ slug: 'rubik', stage: 'production' }]);
});

test('a manual deploy of everything covers every buildable entry', () => {
  const result = onManual('all', 'production');
  assert.deepEqual(slugs(deployOf(result)), buildableSlugs(realEntries()));
  assert.equal(result.deploy.every((row) => row.stage === 'production'), true);
});

test('a manual deploy of an App with no build cannot quietly deploy', () => {
  const result = onManual('spring-api', 'production');
  assert.deepEqual(result.deploy, []);
  assert.match(result.skipped.find((row) => row.slug === 'spring-api').reason, /no build/);
});

test('a manual deploy of an unknown App is a hard error', () => {
  assert.throws(() => onManual('rubix'), /unknown app/);
});

test('a manual deploy without a stage is a hard error', () => {
  assert.throws(
    () => plan({ entries: realEntries(), trigger: { kind: 'manual', app: 'all' } }),
    /needs a stage/,
  );
});

// --- invariants --------------------------------------------------------------

test('every entry lands in deploy or skipped, never both, never neither', () => {
  const entries = realEntries();
  const results = [
    onPush(['06-Rubik/index.html']),
    onPush(['apps.json']),
    onPush(['README.md'], 'main'),
    onManual('all'),
  ];

  for (const result of results) {
    const deployed = slugs(deployOf(result));
    const skipped = slugs(result.skipped);
    assert.deepEqual(
      [...deployed, ...skipped].sort(),
      entries.map((entry) => entry.slug).sort(),
    );
    assert.equal(deployed.filter((slug) => skipped.includes(slug)).length, 0);
  }
});

test('plan does not read the disk or the environment', () => {
  const result = onPush(['08-dashboard/src/main.js']);
  assert.deepEqual(slugs(deployOf(result)), ['apps']);
});
