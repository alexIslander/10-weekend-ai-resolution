// Provisioning is a decision over registry + account state, so every case here
// is a fixture: what to create, what to attach, and what a second run does.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  applyPlan,
  describeProvisioning,
  provisioningPlan,
} from './provision.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const realEntries = () =>
  JSON.parse(readFileSync(join(root, 'apps.json'), 'utf8')).entries;

const pagesEntry = (slug, project = slug) => ({
  slug,
  title: slug,
  kind: 'app',
  target: 'pages',
  project,
  build: { dir: '08-dashboard', out: 'dist' },
  live: false,
});

const awsEntry = (slug) => ({
  slug,
  title: slug,
  kind: 'service',
  target: 'aws',
  url: `https://${slug}.csete.cc`,
  live: false,
});

const workersEntry = (slug) => ({
  slug,
  title: slug,
  kind: 'app',
  target: 'workers',
  project: slug,
  build: { dir: '00-dualreveal', out: 'dist' },
  live: false,
});

const fakeClient = () => {
  const calls = [];
  return {
    calls,
    async createProject(project) {
      calls.push(`create ${project}`);
    },
    async attachDomain(project, domain) {
      calls.push(`attach ${domain} ${project}`);
    },
  };
};

test('describes a create and an attach for every pages entry, in registry order', () => {
  const { descriptions, skipped } = describeProvisioning([
    pagesEntry('apps', '10-weekend-ai-resolution'),
    pagesEntry('rubik'),
  ]);

  assert.deepEqual(skipped, []);
  assert.deepEqual(descriptions, [
    {
      slug: 'apps',
      steps: [
        { kind: 'create-project', project: '10-weekend-ai-resolution' },
        { kind: 'attach-domain', project: '10-weekend-ai-resolution', domain: 'apps.csete.cc' },
      ],
    },
    {
      slug: 'rubik',
      steps: [
        { kind: 'create-project', project: 'rubik' },
        { kind: 'attach-domain', project: 'rubik', domain: 'rubik.csete.cc' },
      ],
    },
  ]);
});

test('an unimplemented target is reported and never turned into a step', () => {
  const { descriptions, skipped } = describeProvisioning([
    pagesEntry('rubik'),
    workersEntry('dualreveal'),
    awsEntry('spring-api'),
  ]);

  assert.deepEqual(descriptions.map((entry) => entry.slug), ['rubik']);
  assert.deepEqual(skipped.map((entry) => [entry.slug, entry.target]), [
    ['dualreveal', 'workers'],
    ['spring-api', 'aws'],
  ]);
  assert.match(skipped[0].reason, /not implemented/);
});

test('with no projects yet, every entry yields a create then an attach', () => {
  const { steps } = provisioningPlan([pagesEntry('rubik')], { projects: {} });

  assert.deepEqual(steps.map((step) => step.kind), ['create-project', 'attach-domain']);
  assert.equal(steps[0].project, 'rubik');
  assert.equal(steps[1].domain, 'rubik.csete.cc');
});

test('an existing project with its domain attached yields nothing', () => {
  const { steps } = provisioningPlan([pagesEntry('rubik')], {
    projects: { rubik: { domains: ['rubik.csete.cc'] } },
  });

  assert.deepEqual(steps, []);
});

test('an existing project without its domain yields the attach only', () => {
  const { steps } = provisioningPlan([pagesEntry('rubik')], {
    projects: { rubik: { domains: ['rubik.pages.dev'] } },
  });

  assert.deepEqual(steps, [
    { kind: 'attach-domain', project: 'rubik', domain: 'rubik.csete.cc' },
  ]);
});

test('a second run over the state the first run produced has nothing left to do', async () => {
  const entries = [pagesEntry('apps', '10-weekend-ai-resolution'), pagesEntry('rubik')];
  const first = provisioningPlan(entries, { projects: {} });
  const client = fakeClient();

  await applyPlan(first.steps, client);

  // The account now looks like what the client was told to make.
  const after = { projects: {} };
  for (const step of first.steps) {
    if (step.kind === 'create-project') after.projects[step.project] = { domains: [] };
    else after.projects[step.project].domains.push(step.domain);
  }

  assert.deepEqual(provisioningPlan(entries, after).steps, []);
});

test('a run that failed halfway converges on the next run', () => {
  const entries = [pagesEntry('rubik'), pagesEntry('rubik-game'), pagesEntry('apps')];
  const partial = { projects: { rubik: { domains: ['rubik.csete.cc'] } } };

  const { steps, skipped } = provisioningPlan(entries, partial);

  assert.deepEqual(skipped, []);
  assert.deepEqual(steps, [
    { kind: 'create-project', project: 'rubik-game' },
    { kind: 'attach-domain', project: 'rubik-game', domain: 'rubik-game.csete.cc' },
    { kind: 'create-project', project: 'apps' },
    { kind: 'attach-domain', project: 'apps', domain: 'apps.csete.cc' },
  ]);
});

test('applies the plan in order, create before attach, and reports what ran', async () => {
  const { steps } = provisioningPlan([pagesEntry('rubik'), pagesEntry('apps')], {
    projects: {},
  });
  const client = fakeClient();

  const applied = await applyPlan(steps, client);

  assert.deepEqual(client.calls, [
    'create rubik',
    'attach rubik.csete.cc rubik',
    'create apps',
    'attach apps.csete.cc apps',
  ]);
  assert.equal(applied.length, steps.length);
});

test('an empty plan touches nothing', async () => {
  const client = fakeClient();

  const applied = await applyPlan([], client);

  assert.deepEqual(applied, []);
  assert.deepEqual(client.calls, []);
});

test('refuses an unknown step rather than guessing', async () => {
  await assert.rejects(
    () => applyPlan([{ kind: 'delete-project', project: 'rubik' }], fakeClient()),
    /unknown step "delete-project"/,
  );
});

test("today's registry is five provisioning entries and four skipped", () => {
  const { descriptions, skipped } = describeProvisioning(realEntries());

  assert.deepEqual(descriptions.map((entry) => entry.slug), [
    'apps',
    'lit-starter',
    'admin-starter',
    'rubik',
    'rubik-game',
  ]);
  // dualreveal is a workers entry: no steps, and reported like the AWS ones.
  assert.deepEqual(skipped.map((entry) => entry.slug), [
    'dualreveal',
    'spring-api',
    'second-brain',
    'barefoot',
  ]);
  assert.deepEqual(descriptions[0].steps[1], {
    kind: 'attach-domain',
    project: '10-weekend-ai-resolution',
    domain: 'apps.csete.cc',
  });
});
