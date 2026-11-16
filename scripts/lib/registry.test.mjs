import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { deployView, hostnameFor, loadRegistry, tileView, validate } from './registry.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const realEntries = () =>
  JSON.parse(readFileSync(join(repoRoot, 'apps.json'), 'utf8')).entries;

const pagesEntry = (overrides = {}) => ({
  slug: 'lit-starter',
  title: 'Lit Starter',
  kind: 'app',
  target: 'pages',
  project: '01-lit-starter',
  build: { dir: '01-lit-starter', out: 'dist' },
  live: false,
  ...overrides,
});

const awsEntry = (overrides = {}) => ({
  slug: 'spring-api',
  title: 'Spring API',
  kind: 'service',
  target: 'aws',
  url: 'https://spring-api.csete.cc',
  live: false,
  ...overrides,
});

function fixtureRoot(t, dirs) {
  const root = mkdtempSync(join(tmpdir(), 'registry-'));
  for (const dir of dirs) mkdirSync(join(root, dir), { recursive: true });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

test('a valid pages entry has no problems', () => {
  assert.deepEqual(validate([pagesEntry()], repoRoot), []);
});

test('a valid aws entry has no problems', () => {
  assert.deepEqual(validate([awsEntry()], repoRoot), []);
});

const invalidCases = [
  {
    name: 'duplicate slugs',
    entries: [pagesEntry(), pagesEntry()],
    expect: 'duplicates entries[0]',
  },
  {
    name: 'a slug that is not kebab-case',
    entries: [pagesEntry({ slug: 'Lit_Starter' })],
    expect: 'is not kebab-case',
  },
  {
    name: 'an unknown kind',
    entries: [pagesEntry({ kind: 'worker' })],
    expect: 'kind "worker"',
  },
  {
    name: 'an unknown target',
    entries: [pagesEntry({ target: 'netlify' })],
    expect: 'target "netlify"',
  },
  {
    name: 'a pages entry without a project',
    entries: [pagesEntry({ project: undefined })],
    expect: 'needs a project',
  },
  {
    name: 'a pages entry without a build',
    entries: [pagesEntry({ build: undefined })],
    expect: 'needs build { dir, out }',
  },
  {
    name: 'a build without an out',
    entries: [pagesEntry({ build: { dir: '01-lit-starter' } })],
    expect: 'build.out is required',
  },
  {
    name: 'a pages entry carrying a literal url',
    entries: [pagesEntry({ url: 'https://lit-starter.csete.cc' })],
    expect: 'drop url',
  },
  {
    name: 'an aws entry carrying a build',
    entries: [awsEntry({ build: { dir: '04-spring-boot-api', out: 'target' } })],
    expect: 'an aws entry must have no build',
  },
  {
    name: 'an aws entry without a url',
    entries: [awsEntry({ url: undefined })],
    expect: 'needs a literal url',
  },
  {
    name: 'a live flag that is not a boolean',
    entries: [pagesEntry({ live: 'yes' })],
    expect: 'live must be true or false',
  },
  {
    name: 'a missing registry',
    entries: undefined,
    expect: 'expected an object with an "entries" array',
  },
];

for (const { name, entries, expect } of invalidCases) {
  test(`rejects ${name}`, () => {
    const problems = validate(entries, repoRoot);
    assert.equal(problems.length, 1, problems.join('\n'));
    assert.match(problems[0], new RegExp(escapeRegExp(expect)));
  });
}

test('a build.dir that is not on disk is a problem, build.out is not checked', (t) => {
  const root = fixtureRoot(t, ['07-Rubik-game/app/src']);

  const missing = validate(
    [pagesEntry({ build: { dir: '08-dashboard', out: 'dist' } })],
    root,
  );
  assert.equal(missing.length, 1);
  assert.match(missing[0], /build\.dir "08-dashboard" does not exist/);

  const unknowable = validate(
    [pagesEntry({ build: { dir: '07-Rubik-game/app/src', out: 'not-built-yet' } })],
    root,
  );
  assert.deepEqual(unknowable, []);
});

test('reports every problem rather than the first', () => {
  const problems = validate([
    pagesEntry({ slug: 'Not Kebab', kind: 'thing' }),
    awsEntry({ slug: 'also-bad', build: { dir: '.', out: '.' } }),
  ], repoRoot);
  assert.ok(problems.length >= 3, problems.join('\n'));
});

test('every entry in the real registry is valid apart from on-disk build dirs', () => {
  // build.dir existence depends on what is checked out, so it is the one rule
  // this test tolerates. Everything else about the real file has to hold.
  const problems = validate(realEntries(), repoRoot);
  const diskOnly = problems.filter((problem) => !/build\.dir "[^"]+" does not exist/.test(problem));
  assert.deepEqual(diskOnly, []);
});

test('loadRegistry loads the real registry shape', () => {
  const entries = realEntries();
  assert.equal(entries.length, 9);
  assert.deepEqual(
    entries.map((entry) => entry.slug),
    ['apps', 'lit-starter', 'admin-starter', 'rubik', 'rubik-game', 'dualreveal',
      'spring-api', 'second-brain', 'barefoot'],
  );
  assert.equal(entries.every((entry) => entry.live === false), true);
});

test('loadRegistry reads a registry from disk', (t) => {
  const root = fixtureRoot(t, ['01-lit-starter']);
  const path = join(root, 'apps.json');

  writeFileSync(path, JSON.stringify({ entries: [pagesEntry()] }));
  assert.equal(loadRegistry(path, root).length, 1);
});

test('loadRegistry rejects a bare array: the registry is one keyed object', (t) => {
  const root = fixtureRoot(t, ['01-lit-starter']);
  const path = join(root, 'apps.json');

  writeFileSync(path, JSON.stringify([pagesEntry()]));
  assert.throws(() => loadRegistry(path, root), /expected an object with an "entries" array/);
});

test('loadRegistry throws with every problem, not the first', (t) => {
  const root = fixtureRoot(t, ['01-lit-starter']);
  const path = join(root, 'apps.json');
  writeFileSync(
    path,
    JSON.stringify({ entries: [pagesEntry({ slug: 'Bad Slug' }), awsEntry({ kind: 'thing' })] }),
  );

  assert.throws(
    () => loadRegistry(path, root),
    (error) => {
      assert.match(error.message, /has 2 problem\(s\)/);
      assert.equal(error.message.split('\n').length, 3);
      return true;
    },
  );
});

test('loadRegistry rejects unreadable JSON', (t) => {
  const root = fixtureRoot(t, []);
  const path = join(root, 'apps.json');
  writeFileSync(path, '{ nope');
  assert.throws(() => loadRegistry(path, root), /is not valid JSON/);
  assert.throws(() => loadRegistry(join(root, 'absent.json'), root), /cannot read/);
});

test('hostnameFor derives pages and workers hostnames from the slug', () => {
  assert.equal(hostnameFor(pagesEntry()), 'https://lit-starter.csete.cc');
  assert.equal(
    hostnameFor(pagesEntry({ slug: 'dualreveal', target: 'workers' })),
    'https://dualreveal.csete.cc',
  );
  assert.equal(hostnameFor(awsEntry()), 'https://spring-api.csete.cc');
});

test('tileView carries only what a Tile renders', () => {
  assert.deepEqual(tileView(pagesEntry({ live: true })), {
    slug: 'lit-starter',
    title: 'Lit Starter',
    kind: 'app',
    url: 'https://lit-starter.csete.cc',
    live: true,
  });
});

test('tileView falls back to a title derived from the slug', () => {
  assert.equal(tileView(pagesEntry({ title: undefined })).title, 'Lit Starter');
});

test('deployView carries only what the deploy matrix reads', () => {
  assert.deepEqual(deployView(pagesEntry()), {
    slug: 'lit-starter',
    target: 'pages',
    project: '01-lit-starter',
    build: { dir: '01-lit-starter', out: 'dist' },
  });
  assert.deepEqual(deployView(awsEntry()), {
    slug: 'spring-api',
    target: 'aws',
    project: null,
    build: null,
  });
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
