// The stage rule is one line of behaviour with three readers, so it is pinned
// directly: every ref form the workflows can hand over.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { branchOf, stageFor } from './stage.mjs';

test('main is production, in both ref forms', () => {
  assert.equal(stageFor('main'), 'production');
  assert.equal(stageFor('refs/heads/main'), 'production');
});

test('everything else is staging, including no ref at all', () => {
  for (const ref of [
    'feature/deploy-pipeline',
    'refs/heads/feature/deploy-pipeline',
    'develop',
    'main-menu',
    undefined,
    null,
    '',
  ]) {
    assert.equal(stageFor(ref), 'staging', `ref ${String(ref)} should be staging`);
  }
});

test('the branch alias drops the ref prefix and keeps the slashes', () => {
  assert.equal(branchOf('refs/heads/feature/deploy-pipeline'), 'feature/deploy-pipeline');
  assert.equal(branchOf('main'), 'main');
  assert.equal(branchOf(undefined), undefined);
});
