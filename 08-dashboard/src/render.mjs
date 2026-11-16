// The page, as a string. Pure: a view model in, a complete document out, and
// the build writes it. No client JavaScript is involved, so there is nothing in
// the bundle that could call an API or read a credential.

const ESCAPES = new Map([
  ['&', '&amp;'],
  ['<', '&lt;'],
  ['>', '&gt;'],
  ['"', '&quot;'],
  ["'", '&#39;'],
]);

const escape = (text) => String(text).replace(/[&<>"']/g, (char) => ESCAPES.get(char));

const hostOf = (url) => new URL(url).host;

const TITLE = 'Apps';

export function renderPage(view) {
  if (view === null || typeof view !== 'object') {
    throw new TypeError('renderPage: view must be an object');
  }

  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1">',
    `  <title>${escape(TITLE)}</title>`,
    '  <meta name="description" content="Every App and Service in this monorepo, from the Apps Registry.">',
    '  <link rel="stylesheet" href="./style.css">',
    '</head>',
    '<body>',
    '  <header class="masthead">',
    `    <h1>${escape(TITLE)}</h1>`,
    '    <p class="lede">Everything this repo serves, in one place.</p>',
    '  </header>',
    '  <main>',
    '    <section class="apps" aria-label="Apps">',
    ...renderTiles(view.tiles ?? []),
    '    </section>',
    '    <section class="services" aria-label="Services">',
    '      <h2>Services</h2>',
    ...renderServices(view.services ?? []),
    '    </section>',
    '  </main>',
    '  <footer class="foot">',
    '    <p>Built from the Apps Registry. Tiles link to each App&rsquo;s hostname.</p>',
    '  </footer>',
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

function renderTiles(tiles) {
  if (tiles.length === 0) return ['      <p class="empty">No Apps in the registry.</p>'];

  return tiles.flatMap((tile) => [
    `      <a class="tile" href="${escape(tile.url)}" data-live="${tile.live === true}">`,
    `        <span class="tile__title">${escape(tile.title)}</span>`,
    `        <span class="tile__host">${escape(hostOf(tile.url))}</span>`,
    ...(tile.live === true ? [] : ['        <span class="tile__flag">not live yet</span>']),
    '      </a>',
  ]);
}

function renderServices(services) {
  if (services.length === 0) return ['      <p class="empty">No Services in the registry.</p>'];

  return [
    '      <ul>',
    ...services.map(
      (service) =>
        `        <li><a class="service" href="${escape(service.url)}">${escape(service.title)}</a></li>`,
    ),
    '      </ul>',
  ];
}
