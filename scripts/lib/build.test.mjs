// The build convention is what keeps per-project knowledge out of the workflow,
// so each branch of it is pinned against a real folder on disk.

import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { buildPlan } from './build.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const entry = (dir) => ({ slug: 'app', build: { dir, out: 'dist' } });

const fixture = (files) => {
  const base = mkdtempSync(join(tmpdir(), 'build-plan-'));
  mkdirSync(join(base, 'app'));
  for (const [name, contents] of Object.entries(files)) {
    writeFileSync(join(base, 'app', name), contents);
  }
  return base;
};

test('a package.json with a lockfile installs with ci, then builds', () => {
  const base = fixture({
    'package.json': JSON.stringify({ scripts: { build: 'vite build' } }),
    'package-lock.json': '{}',
  });

  assert.deepEqual(buildPlan(entry('app'), base), {
    cwd: 'app',
    steps: ['npm ci', 'npm run build'],
  });
});

test('a package.json without a lockfile installs, then builds', () => {
  const base = fixture({
    'package.json': JSON.stringify({ scripts: { build: 'vite build' } }),
  });

  assert.deepEqual(buildPlan(entry('app'), base).steps, ['npm install', 'npm run build']);
});

test('a package.json with no build script is an error, not a silent no-op', () => {
  const base = fixture({ 'package.json': JSON.stringify({ scripts: { test: 'vitest' } }) });

  assert.throws(() => buildPlan(entry('app'), base), /has a package\.json with no build script/);
});

test('a build.mjs runs with node', () => {
  const base = fixture({ 'build.mjs': 'console.log("built")' });

  assert.deepEqual(buildPlan(entry('app'), base), {
    cwd: 'app',
    steps: ['node build.mjs'],
  });
});

test('a folder with neither is already the artifact', () => {
  const base = fixture({ 'index.html': '<!doctype html>' });

  assert.deepEqual(buildPlan(entry('app'), base), { cwd: 'app', steps: [] });
});

test('package.json wins over build.mjs when both exist', () => {
  const base = fixture({
    'package.json': JSON.stringify({ scripts: { build: 'vite build' } }),
    'build.mjs': 'console.log("nope")',
  });

  assert.deepEqual(buildPlan(entry('app'), base).steps, ['npm install', 'npm run build']);
});

test("every built App in today's registry resolves to a plan, by convention", () => {
  const expected = {
    apps: { cwd: '08-dashboard', steps: ['node build.mjs'] },
    'lit-starter': { cwd: '01-lit-starter', steps: ['npm ci', 'npm run build'] },
    'admin-starter': { cwd: '02-lit-admin-starter', steps: ['npm ci', 'npm run build'] },
    rubik: { cwd: '06-Rubik', steps: [] },
    'rubik-game': { cwd: '07-Rubik-game/app/src', steps: [] },
  };

  for (const [slug, plan] of Object.entries(expected)) {
    const dir = plan.cwd;
    assert.deepEqual(buildPlan({ slug, build: { dir, out: '.' } }, root), plan);
  }
});

test('an entry with no build descriptor is refused', () => {
  assert.throws(() => buildPlan({ slug: 'aws-thing' }, root), /build\.dir is required/);
});
