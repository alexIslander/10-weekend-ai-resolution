// What the deploy workflow is told, per App. The cases that matter are the
// refusals: an unknown App, an unimplemented target before any build, and a
// staging run that cannot name its branch.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { describeDeploy } from './deploy.mjs';
import { TargetNotImplemented } from './targets.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const realEntries = () =>
  JSON.parse(readFileSync(join(root, 'apps.json'), 'utf8')).entries;

const describe = (slug, ref) => describeDeploy({ entries: realEntries(), slug, ref, root });

test('production is main, and the Dashboard is the App that proves the shape', () => {
  assert.deepEqual(describe('apps', 'refs/heads/main'), {
    slug: 'apps',
    kind: 'app',
    stage: 'production',
    target: 'pages',
    project: '10-weekend-ai-resolution',
    branch: 'main',
    dir: '08-dashboard/dist',
  });
});

test('a feature ref is staging, and the branch under test is carried through', () => {
  const described = describe('rubik', 'refs/heads/feature/deploy-pipeline');

  assert.equal(described.stage, 'staging');
  assert.equal(described.branch, 'feature/deploy-pipeline');
  assert.equal(described.project, 'rubik');
  assert.equal(described.dir, '06-Rubik');
});

test('a staging ref with no branch is refused rather than guessed', () => {
  assert.throws(() => describe('rubik', undefined), /needs the branch under test/);
});

test('an unknown App is refused by name', () => {
  assert.throws(() => describe('nope', 'main'), /unknown App "nope"/);
});

test('unimplemented targets throw before anything else happens', () => {
  for (const slug of ['dualreveal', 'spring-api', 'second-brain', 'barefoot']) {
    assert.throws(() => describe(slug, 'main'), TargetNotImplemented, slug);
  }
});

test("every pages entry in today's registry describes a deploy", () => {
  const described = realEntries()
    .filter((entry) => entry.target === 'pages')
    .map((entry) => describe(entry.slug, 'refs/heads/main'));

  assert.deepEqual(described.map((d) => d.slug), [
    'apps',
    'lit-starter',
    'admin-starter',
    'rubik',
    'rubik-game',
  ]);

  for (const d of described) {
    assert.equal(d.stage, 'production');
    assert.equal(d.branch, 'main');
    assert.equal(typeof d.dir, 'string');
    assert.ok(d.dir.length > 0);
  }
});
