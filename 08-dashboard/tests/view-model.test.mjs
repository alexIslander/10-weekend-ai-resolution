// The view model is the Dashboard's one seam: registry entries in, what the
// page renders out. No DOM, no browser, no disk — so the tests are fixture
// registries and the real one.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { dashboardView } from '../src/view-model.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const fixture = [
  {
    slug: 'apps',
    title: 'Apps',
    kind: 'app',
    target: 'pages',
    project: '10-weekend-ai-resolution',
    build: { dir: '08-dashboard', out: 'dist' },
    live: true,
  },
  {
    slug: 'rubik',
    kind: 'app',
    target: 'pages',
    project: 'rubik',
    build: { dir: '06-Rubik', out: '.' },
    live: false,
  },
  {
    slug: 'spring-api',
    title: 'Spring API',
    kind: 'service',
    target: 'aws',
    url: 'https://spring-api.csete.cc',
    live: false,
  },
];

const realEntries = () =>
  JSON.parse(readFileSync(join(root, 'apps.json'), 'utf8')).entries;

test('keeps registry order in the Tiles', () => {
  const view = dashboardView(fixture);

  assert.deepEqual(
    view.tiles.map((tile) => tile.slug),
    ['apps', 'rubik'],
  );
});

test('a Service is a link, never a Tile', () => {
  const view = dashboardView(fixture);

  assert.deepEqual(
    view.tiles.map((tile) => tile.slug),
    ['apps', 'rubik'],
  );
  assert.deepEqual(view.services, [
    { title: 'Spring API', url: 'https://spring-api.csete.cc' },
  ]);
});

test('a registry with no Services renders no links', () => {
  const view = dashboardView(fixture.filter((entry) => entry.kind === 'app'));

  assert.deepEqual(view.services, []);
});

test('a Tile carries only what a Tile renders', () => {
  const [tile] = dashboardView(fixture).tiles;

  assert.deepEqual(Object.keys(tile).sort(), ['kind', 'live', 'slug', 'title', 'url']);
  assert.equal(tile.title, 'Apps');
  assert.equal(tile.url, 'https://apps.csete.cc');
  assert.equal(tile.live, true);
});

test('a link carries a label and a hostname, nothing else', () => {
  const [link] = dashboardView(fixture).services;

  assert.deepEqual(Object.keys(link).sort(), ['title', 'url']);
});

test('derives the hostname from the slug, not from the registry text', () => {
  const view = dashboardView(fixture);
  const rubik = view.tiles.find((tile) => tile.slug === 'rubik');

  assert.equal(rubik.url, 'https://rubik.csete.cc');
  assert.equal(view.tiles[0].url, 'https://apps.csete.cc');
});

test("today's registry is six Tiles and three Service links", () => {
  const view = dashboardView(realEntries());

  assert.equal(view.tiles.length, 6);
  assert.equal(view.services.length, 3);
  assert.deepEqual(
    view.tiles.map((tile) => tile.url),
    [
      'https://apps.csete.cc',
      'https://lit-starter.csete.cc',
      'https://admin-starter.csete.cc',
      'https://rubik.csete.cc',
      'https://rubik-game.csete.cc',
      'https://dualreveal.csete.cc',
    ],
  );
  assert.deepEqual(
    view.services.map((link) => link.url),
    [
      'https://spring-api.csete.cc',
      'https://second-brain.csete.cc',
      'https://barefoot.csete.cc',
    ],
  );
});

test('nothing the deploy matrix reads survives the view model', () => {
  const serialised = JSON.stringify(dashboardView(realEntries()));

  for (const leak of ['target', 'project', 'build', 'pages', 'workers', 'aws', '06-Rubik']) {
    assert.ok(!serialised.includes(leak), `view model leaks "${leak}"`);
  }
});
