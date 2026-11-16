// The page is a pure function over the view model, so it is tested as a
// string: how many Tiles, how many links, which hrefs, and what leaked.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { renderPage } from '../src/render.mjs';
import { dashboardView } from '../src/view-model.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const realEntries = () =>
  JSON.parse(readFileSync(join(root, 'apps.json'), 'utf8')).entries;

const realPage = () => renderPage(dashboardView(realEntries()));

const hrefs = (html, className) =>
  [...html.matchAll(new RegExp(`<a class="${className}" href="([^"]+)"`, 'g'))].map(
    (match) => match[1],
  );

test('renders one Tile per App, linking to its production hostname', () => {
  assert.deepEqual(hrefs(realPage(), 'tile'), [
    'https://apps.csete.cc',
    'https://lit-starter.csete.cc',
    'https://admin-starter.csete.cc',
    'https://rubik.csete.cc',
    'https://rubik-game.csete.cc',
    'https://dualreveal.csete.cc',
  ]);
});

test('renders one link per Service, labelled with its title', () => {
  const page = realPage();

  assert.deepEqual(hrefs(page, 'service'), [
    'https://spring-api.csete.cc',
    'https://second-brain.csete.cc',
    'https://barefoot.csete.cc',
  ]);
  assert.match(page, /<a class="service" href="https:\/\/second-brain\.csete\.cc">Second Brain Ingester<\/a>/);
});

test('shows each hostname as text, so a Tile is readable without clicking', () => {
  assert.match(realPage(), />rubik-game\.csete\.cc</);
});

test('marks an App that is not live yet, and does not mark a live one', () => {
  const page = renderPage({
    tiles: [
      { slug: 'a', title: 'A', kind: 'app', url: 'https://a.csete.cc', live: true },
      { slug: 'b', title: 'B', kind: 'app', url: 'https://b.csete.cc', live: false },
    ],
    services: [],
  });

  assert.match(page, /<a class="tile" href="https:\/\/a\.csete\.cc" data-live="true">/);
  assert.match(page, /<a class="tile" href="https:\/\/b\.csete\.cc" data-live="false">/);
  assert.equal((page.match(/not live yet/g) ?? []).length, 1);
});

test('says so when the registry has no Services', () => {
  const page = renderPage({ tiles: [], services: [] });

  assert.match(page, /no Services in the registry/i);
});

test('escapes a title rather than emitting it as markup', () => {
  const page = renderPage({
    tiles: [
      {
        slug: 'a',
        title: 'A & B <script>alert(1)</script>',
        kind: 'app',
        url: 'https://a.csete.cc',
        live: false,
      },
    ],
    services: [{ title: 'S & T', url: 'https://t.csete.cc' }],
  });

  assert.ok(!page.includes('<script>'));
  assert.match(page, /A &amp; B &lt;script&gt;/);
  assert.match(page, />S &amp; T</);
});

test('the rendered page carries no deploy field and no credential', () => {
  const page = realPage();

  for (const leak of [
    'target',
    'build',
    '10-weekend-ai-resolution',
    '08-dashboard',
    '06-Rubik',
    '07-Rubik-game',
    'CLOUDFLARE',
    'api.cloudflare.com',
  ]) {
    assert.ok(!page.includes(leak), `page leaks "${leak}"`);
  }
});

test('is a complete document that loads one local stylesheet', () => {
  const page = realPage();

  assert.match(page, /^<!doctype html>/i);
  assert.match(page, /<html lang="en">/);
  assert.match(page, /<link rel="stylesheet" href="\.\/style\.css">/);
  assert.match(page, /<\/html>\n$/);
  assert.ok(!/<script/i.test(page), 'the page needs no client JavaScript');
});
