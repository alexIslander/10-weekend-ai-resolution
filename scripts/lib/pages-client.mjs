// The Cloudflare Pages side of provisioning: three calls, no decisions.
//
// The token and account id are arguments, never module state, so nothing here
// can read a credential the caller did not hand over. `fetchImpl` is injectable
// for the same reason the target table is pure — the request shapes are
// testable without an account.

const API = 'https://api.cloudflare.com/client/v4';

export class CloudflareError extends Error {
  constructor(summary, { status, errors } = {}) {
    const detail = (errors ?? []).map((error) => `${error.code}: ${error.message}`).join('; ');
    const suffix = detail === '' ? '' : ` — ${detail}`;
    super(`${summary}${status === undefined ? '' : ` (HTTP ${status})`}${suffix}`);
    this.name = 'CloudflareError';
    this.status = status;
    this.errors = errors ?? [];
  }
}

export function pagesClient({ token, accountId, fetchImpl = globalThis.fetch } = {}) {
  if (typeof token !== 'string' || token.trim() === '') {
    throw new Error('pagesClient: a Cloudflare API token is required');
  }
  if (typeof accountId !== 'string' || accountId.trim() === '') {
    throw new Error('pagesClient: a Cloudflare account id is required');
  }

  const request = async (method, path, body) => {
    const response = await fetchImpl(`${API}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new CloudflareError(`${method} ${path} returned a body that is not JSON`, {
        status: response.status,
      });
    }

    if (!response.ok || payload?.success !== true) {
      throw new CloudflareError(`${method} ${path} failed`, {
        status: response.status,
        errors: payload?.errors,
      });
    }

    return payload;
  };

  // Every project on the account, with the domains already attached to it.
  //
  // `per_page` is deliberately not sent: the Pages endpoint rejects the usual
  // 100 with `8000024: Invalid list options provided`, and its own default page
  // size is what `result_info` reports, so the loop follows that instead.
  const readState = async () => {
    const projects = {};
    let page = 1;
    let totalPages = 1;

    do {
      const payload = await request(
        'GET',
        `/accounts/${accountId}/pages/projects?page=${page}`,
      );
      const list = Array.isArray(payload.result) ? payload.result : [];

      for (const project of list) projects[project.name] = { domains: [] };

      totalPages = Number(payload.result_info?.total_pages) || 1;
      page += 1;
    } while (page <= totalPages);

    // The projects list carries the `*.pages.dev` hostnames only, so a custom
    // domain has to be read from the project itself. Without this call a domain
    // that is already attached looks missing and the plan never empties.
    for (const name of Object.keys(projects)) {
      const payload = await request(
        'GET',
        `/accounts/${accountId}/pages/projects/${name}/domains`,
      );
      projects[name].domains = (Array.isArray(payload.result) ? payload.result : [])
        .map((domain) => domain.name);
    }

    return { projects };
  };

  return {
    readState,
    createProject: (project) =>
      request('POST', `/accounts/${accountId}/pages/projects`, {
        name: project,
        production_branch: 'main',
      }),
    attachDomain: (project, domain) =>
      request('POST', `/accounts/${accountId}/pages/projects/${project}/domains`, {
        name: domain,
      }),
  };
}
