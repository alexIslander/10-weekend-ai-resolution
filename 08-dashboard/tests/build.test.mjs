// The build is what ships, so the test runs it: into a temporary folder, over
// the real registry, and then reads the bytes that would be deployed.

import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { buildDashboard } from '../src/build.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const buildInto = () => {
  const outDir = mkdtempSync(join(tmpdir(), 'dashboard-'));
  const result = buildDashboard({ root, outDir });
  return { outDir, result };
};

test('writes the deployable folder: index.html and its stylesheet', () => {
  const { outDir, result } = buildInto();

  assert.deepEqual(readdirSync(outDir).sort(), ['index.html', 'style.css']);
  assert.equal(result.files.length, 2);
  assert.match(readFileSync(join(outDir, 'index.html'), 'utf8'), /<!doctype html>/i);
});

test("the built page renders today's six Tiles and three Service links", () => {
  const { outDir } = buildInto();
  const page = readFileSync(join(outDir, 'index.html'), 'utf8');

  assert.equal((page.match(/<a class="tile"/g) ?? []).length, 6);
  assert.equal((page.match(/<a class="service"/g) ?? []).length, 3);
  assert.match(page, /href="https:\/\/apps\.csete\.cc"/);
});

test('nothing in the shipped folder mentions a deploy field or a credential', () => {
  const { outDir } = buildInto();

  for (const name of readdirSync(outDir)) {
    const text = readFileSync(join(outDir, name), 'utf8');
    for (const leak of ['target', 'project', 'CLOUDFLARE', 'api.cloudflare.com']) {
      assert.ok(!text.includes(leak), `${name} leaks "${leak}"`);
    }
  }
});

test('refuses a registry that does not validate, and ships nothing', () => {
  const outDir = mkdtempSync(join(tmpdir(), 'dashboard-bad-'));
  const emptyRoot = mkdtempSync(join(tmpdir(), 'dashboard-root-'));
  rmSync(outDir, { recursive: true, force: true });

  assert.throws(
    () => buildDashboard({ root: emptyRoot, outDir }),
    /cannot read .*apps\.json/,
  );
  assert.deepEqual(readdirSync(emptyRoot), []);
});
