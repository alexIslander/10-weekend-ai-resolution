// The Apps Registry: what a valid entry is, and the narrow views its
// consumers read. Pure description — nothing here talks to Cloudflare.
//
// Five exports, no default, and no other state:
//   loadRegistry(path, root)  read + validate, throwing every problem at once
//   validate(entries, root)   the rules, as a list of strings
//   hostnameFor(entry)        the one place a hostname is derived
//   tileView(entry)           what the Dashboard renders
//   deployView(entry)         what the deploy matrix reads
//
// `root` is the directory that `build.dir` is resolved against; it defaults to
// the working directory, which is the repo root whenever the scripts are run
// the documented way.

import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const KINDS = ['app', 'service'];
const TARGETS = ['pages', 'workers', 'aws'];
const BUILT_TARGETS = ['pages', 'workers'];
const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isText = (value) => typeof value === 'string' && value.trim() !== '';

const label = (entry, index) =>
  isPlainObject(entry) && isText(entry.slug)
    ? `apps[${index}] (${entry.slug})`
    : `entries[${index}]`;

export function loadRegistry(path = 'apps.json', root = process.cwd()) {
  let raw;
  try {
    raw = readFileSync(path, 'utf8');
  } catch (error) {
    throw new Error(`registry: cannot read ${path}: ${error.message}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`registry: ${path} is not valid JSON: ${error.message}`);
  }

  const problems = validate(parsed?.entries, root);
  if (problems.length > 0) {
    throw new Error(
      [`registry: ${path} has ${problems.length} problem(s)`, ...problems].join('\n'),
    );
  }
  return parsed.entries;
}

export function validate(entries, root = process.cwd()) {
  if (!Array.isArray(entries)) {
    return ['registry: expected an object with an "entries" array'];
  }

  const problems = [];
  const seen = new Map();

  entries.forEach((entry, index) => {
    const where = label(entry, index);
    if (!isPlainObject(entry)) {
      problems.push(`${where}: entry must be an object`);
      return;
    }

    if (!isText(entry.slug)) {
      problems.push(`${where}: slug is required`);
    } else if (!KEBAB_CASE.test(entry.slug)) {
      problems.push(`${where}: slug "${entry.slug}" is not kebab-case`);
    } else if (seen.has(entry.slug)) {
      problems.push(
        `${where}: slug "${entry.slug}" duplicates entries[${seen.get(entry.slug)}]`,
      );
    } else {
      seen.set(entry.slug, index);
    }

    if (!KINDS.includes(entry.kind)) {
      problems.push(`${where}: kind "${entry.kind}" is not one of ${KINDS.join(', ')}`);
    }

    if (entry.title !== undefined && !isText(entry.title)) {
      problems.push(`${where}: title must be a non-empty string when present`);
    }

    if (typeof entry.live !== 'boolean') {
      problems.push(`${where}: live must be true or false`);
    }

    if (!TARGETS.includes(entry.target)) {
      problems.push(`${where}: target "${entry.target}" is not one of ${TARGETS.join(', ')}`);
      return;
    }

    if (BUILT_TARGETS.includes(entry.target)) {
      if (!isText(entry.project)) {
        problems.push(`${where}: a ${entry.target} entry needs a project`);
      }
      if (entry.url !== undefined) {
        problems.push(`${where}: drop url, it is derived from the slug for ${entry.target}`);
      }
      problems.push(...buildProblems(entry, where, root));
    } else {
      if (entry.build !== undefined) {
        problems.push(`${where}: an aws entry must have no build`);
      }
      if (!isText(entry.url)) {
        problems.push(`${where}: an aws entry needs a literal url`);
      }
    }
  });

  return problems;
}

export function hostnameFor(entry) {
  if (!isPlainObject(entry)) {
    throw new TypeError('hostnameFor: entry must be an object');
  }
  if (BUILT_TARGETS.includes(entry.target)) {
    return `https://${entry.slug}.csete.cc`;
  }
  if (entry.target === 'aws') {
    if (!isText(entry.url)) {
      throw new Error(`hostnameFor: aws entry "${entry.slug}" has no url`);
    }
    return entry.url;
  }
  throw new Error(`hostnameFor: "${entry.slug}" has unknown target "${entry.target}"`);
}

export function tileView(entry) {
  return {
    slug: entry.slug,
    title: isText(entry.title) ? entry.title : titleFor(entry.slug),
    kind: entry.kind,
    url: hostnameFor(entry),
    live: entry.live === true,
  };
}

export function deployView(entry) {
  return {
    slug: entry.slug,
    target: entry.target,
    project: isText(entry.project) ? entry.project : null,
    build: isPlainObject(entry.build)
      ? { dir: entry.build.dir, out: entry.build.out }
      : null,
  };
}

function buildProblems(entry, where, root) {
  const problems = [];
  const build = entry.build;

  if (!isPlainObject(build)) {
    problems.push(`${where}: a ${entry.target} entry needs build { dir, out }`);
    return problems;
  }

  if (!isText(build.dir)) {
    problems.push(`${where}: build.dir is required`);
  } else if (!isDirectory(resolve(root, build.dir))) {
    problems.push(`${where}: build.dir "${build.dir}" does not exist`);
  }

  if (!isText(build.out)) {
    problems.push(`${where}: build.out is required`);
  }

  return problems;
}

function isDirectory(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function titleFor(slug) {
  return String(slug)
    .split('-')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}
