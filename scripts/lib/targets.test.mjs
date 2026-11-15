import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { TargetNotImplemented, resolveTarget } from './targets.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const realEntries = () =>
  JSON.parse(readFileSync(join(repoRoot, 'apps.json'), 'utf8')).entries;

const entryFor = (slug) => realEntries().find((entry) => entry.slug === slug);

test('a pages entry resolves to an adapter that describes both provisioning steps', () => {
  const rubik = entryFor('rubik');
  const target = resolveTarget(rubik);

  assert.deepEqual(target.provision(rubik), { kind: 'create-project', project: 'rubik' });
  assert.deepEqual(target.provision(rubik, 'domain'), {
    kind: 'attach-domain',
    project: 'rubik',
    domain: 'rubik.csete.cc',
  });
});

test('a pages deploy describes the built folder, the project and the branch', () => {
  const litStarter = entryFor('lit-starter');
  const target = resolveTarget(litStarter);

  assert.deepEqual(target.deploy(litStarter, 'production'), {
    kind: 'pages-deploy',
    dir: '01-lit-starter/dist',
    project: '01-lit-starter',
    branch: 'main',
  });
});

test('a build.out of "." deploys the build.dir itself', () => {
  const rubik = entryFor('rubik');
  const rubikGame = entryFor('rubik-game');

  assert.equal(resolveTarget(rubik).deploy(rubik, 'production').dir, '06-Rubik');
  assert.equal(
    resolveTarget(rubikGame).deploy(rubikGame, 'production').dir,
    '07-Rubik-game/app/src',
  );
});

test('a staging deploy takes the branch under test from the caller', () => {
  const rubik = entryFor('rubik');
  const target = resolveTarget(rubik);

  assert.equal(target.deploy(rubik, 'staging', 'feature/deploy-pipeline').branch, 'feature/deploy-pipeline');
  assert.equal(target.deploy(rubik, 'staging').branch, null);
});

test('workers and aws throw TargetNotImplemented', () => {
  for (const slug of ['dualreveal', 'spring-api', 'second-brain', 'barefoot']) {
    assert.throws(
      () => resolveTarget(entryFor(slug)),
      (error) => {
        assert.ok(error instanceof TargetNotImplemented);
        assert.equal(error.slug, slug);
        return true;
      },
      slug,
    );
  }
});

test('an aws entry can never produce a Pages project or domain', () => {
  // ADR-0005: AWS origins get a grey-cloud CNAME, never a Pages project. That
  // rule is enforced here, not remembered, so exercising every aws entry has to
  // end in a throw rather than a description.
  for (const entry of realEntries().filter((candidate) => candidate.target === 'aws')) {
    assert.throws(() => resolveTarget(entry), TargetNotImplemented);
    assert.throws(() => resolveTarget(entry).provision(entry), TargetNotImplemented);
  }
});

test('every deployable entry has a description, every undeployable one throws', () => {
  for (const entry of realEntries()) {
    if (entry.target === 'pages') {
      const description = resolveTarget(entry).deploy(entry, 'production');
      assert.equal(description.kind, 'pages-deploy');
    } else {
      assert.throws(() => resolveTarget(entry), TargetNotImplemented);
    }
  }
});

test('an unknown target is a hard error, not a fallback', () => {
  assert.throws(
    () => resolveTarget({ slug: 'mystery', target: 'netlify' }),
    /unknown target "netlify"/,
  );
});
