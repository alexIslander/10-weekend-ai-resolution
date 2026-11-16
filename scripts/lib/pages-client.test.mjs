// The client's job is the request shape and the error mapping. A fake fetch is
// enough to pin both, and keeps this test off the network.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CloudflareError, pagesClient } from './pages-client.mjs';

const respond = (payload, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => payload,
});

const projectsPayload = (names, totalPages = 1) =>
  respond({
    success: true,
    result: names.map((name) => ({ name, domains: [`${name}.pages.dev`] })),
    result_info: { page: 1, total_pages: totalPages },
  });

const domainsPayload = (...names) =>
  respond({
    success: true,
    result: names.map((name) => ({ name, status: 'pending' })),
  });

// Fetch that answers by URL, so a list call and four domain calls can be told
// apart. `routes` maps a URL fragment to a payload.
const routedFetch = (routes) => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, method: init.method, body: init.body, auth: init.headers.authorization });
    const fragment = Object.keys(routes).find((key) => url.includes(key));
    if (fragment === undefined) throw new Error(`no route for ${url}`);
    return routes[fragment];
  };
  return { calls, fetchImpl };
};

const client = (fetchImpl) =>
  pagesClient({ token: 'test-token', accountId: 'acct', fetchImpl });

test('reads every project and asks each one for its own domains', async () => {
  const { calls, fetchImpl } = routedFetch({
    '/pages/projects?page=1': projectsPayload(['rubik', 'apps']),
    '/pages/projects/rubik/domains': domainsPayload('rubik.csete.cc', 'rubik.pages.dev'),
    '/pages/projects/apps/domains': domainsPayload('apps.csete.cc'),
  });

  const state = await client(fetchImpl).readState();

  assert.deepEqual(state, {
    projects: {
      rubik: { domains: ['rubik.csete.cc', 'rubik.pages.dev'] },
      apps: { domains: ['apps.csete.cc'] },
    },
  });
  assert.equal(calls[0].method, 'GET');
  assert.match(calls[0].url, /\/accounts\/acct\/pages\/projects\?page=1$/);
  assert.equal(calls[0].auth, 'Bearer test-token');
});

test('a custom domain still pending validation counts as attached', async () => {
  const { fetchImpl } = routedFetch({
    '/pages/projects?page=1': projectsPayload(['rubik']),
    '/pages/projects/rubik/domains': domainsPayload('rubik.csete.cc'),
  });

  const state = await client(fetchImpl).readState();

  assert.deepEqual(state.projects.rubik.domains, ['rubik.csete.cc']);
});

test('ignores the pages.dev hostnames the list carries, since the domain call decides', async () => {
  const { fetchImpl } = routedFetch({
    '/pages/projects?page=1': projectsPayload(['rubik']),
    '/pages/projects/rubik/domains': respond({ success: true, result: [] }),
  });

  const state = await client(fetchImpl).readState();

  assert.deepEqual(state.projects.rubik.domains, []);
});

test('follows pagination rather than stopping at the first page', async () => {
  const { calls, fetchImpl } = routedFetch({
    '/pages/projects?page=1': projectsPayload(['one'], 2),
    '/pages/projects?page=2': respond({
      success: true,
      result: [{ name: 'two' }],
      result_info: { page: 2, total_pages: 2 },
    }),
    '/pages/projects/one/domains': domainsPayload('one.csete.cc'),
    '/pages/projects/two/domains': domainsPayload('two.csete.cc'),
  });

  const state = await client(fetchImpl).readState();

  assert.deepEqual(Object.keys(state.projects), ['one', 'two']);
  assert.equal(calls.filter((call) => call.url.includes('page=2')).length, 1);
});

test('creates a project with main as its production branch', async () => {
  const { calls, fetchImpl } = routedFetch({
    '/pages/projects': respond({ success: true, result: {} }),
  });

  await client(fetchImpl).createProject('rubik');

  assert.equal(calls[0].method, 'POST');
  assert.match(calls[0].url, /\/accounts\/acct\/pages\/projects$/);
  assert.deepEqual(JSON.parse(calls[0].body), {
    name: 'rubik',
    production_branch: 'main',
  });
});

test('attaches a domain to a named project', async () => {
  const { calls, fetchImpl } = routedFetch({
    '/pages/projects/rubik/domains': respond({ success: true, result: {} }),
  });

  await client(fetchImpl).attachDomain('rubik', 'rubik.csete.cc');

  assert.match(calls[0].url, /\/accounts\/acct\/pages\/projects\/rubik\/domains$/);
  assert.deepEqual(JSON.parse(calls[0].body), { name: 'rubik.csete.cc' });
});

test('a refused call surfaces Cloudflare own error code and message', async () => {
  const { fetchImpl } = routedFetch({
    '/pages/projects': respond(
      { success: false, errors: [{ code: 8000002, message: 'project already exists' }] },
      409,
    ),
  });

  await assert.rejects(() => client(fetchImpl).createProject('rubik'), (error) => {
    assert.ok(error instanceof CloudflareError);
    assert.equal(error.status, 409);
    assert.match(error.message, /8000002: project already exists/);
    return true;
  });
});

test('a body that is not JSON is reported, not thrown as a parse error', async () => {
  const fetchImpl = async () => ({
    ok: false,
    status: 502,
    json: async () => {
      throw new SyntaxError('Unexpected token < in JSON');
    },
  });

  await assert.rejects(
    () => client(fetchImpl).readState(),
    /returned a body that is not JSON \(HTTP 502\)/,
  );
});

test('refuses to build a client without a token or an account id', () => {
  assert.throws(() => pagesClient({ accountId: 'acct' }), /token is required/);
  assert.throws(() => pagesClient({ token: 't' }), /account id is required/);
});
