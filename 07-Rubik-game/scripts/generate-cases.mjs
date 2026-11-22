#!/usr/bin/env node
/**
 * Builds the game's committed position file from the booklet.
 *
 * Reads the booklet's route fixture (everything but the groups) and its print
 * guide (the 14 group headings, in booklet order), copies the 57 diagrams into
 * the app, checks the result against scripts/assert-cases.mjs and writes
 * app/src/quiz/entity/cases.json.
 *
 *   node scripts/generate-cases.mjs          # regenerate and write
 *   node scripts/generate-cases.mjs --check  # fail if the committed file is stale
 *
 * The output is data: never hand-edit cases.json, regenerate it.
 *
 * Two traps this script exists to avoid:
 * - `friedrich-oll-NN.png` is not OLL case NN. The image is copied from the
 *   fixture's mapping and never derived from the OLL number.
 * - The 14 group names exist only in the print HTML. A reordering there is a
 *   silent data change, so the group sizes are asserted.
 */
import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync, readdirSync, realpathSync, rmSync } from "node:fs";
import { basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { assertCases, GROUP_NAMES } from "./assert-cases.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT = dirname(HERE);
const BOOKLET = `${PROJECT}/../06-Rubik`;
const ROUTES = `${BOOKLET}/tests/fixtures/oll_routes.json`;
const PRINT_GUIDE = `${BOOKLET}/minimal-without-flows-print.html`;
const APP = `${PROJECT}/app/src`;
const OUTPUT = `${APP}/quiz/entity/cases.json`;
const DIAGRAMS = `${APP}/img`;

/** The booklet writes a step without an AUF as an empty string; the game says `none`. */
const normalizeAuf = value => (value === "" || value == null ? "none" : value);

/**
 * The print guide's headings in booklet order, each followed by the OLL
 * numbers printed underneath it.
 * @param {string} html the print guide
 * @returns {{name: string, olls: number[], images: string[]}[]}
 */
export const readGroups = html => {
  const sections = html.split("<h2>").slice(1);
  return sections.map(section => {
    const name = section.slice(0, section.indexOf("</h2>")).trim();
    const printed = [...section.matchAll(/<img src="([^"]+)" alt="OLL (\d+)"/g)].map(([, image, oll]) => ({
      image: `img/${basename(image)}`,
      oll: Number(oll),
    }));
    return { name, olls: printed.map(({ oll }) => oll), images: printed.map(({ image }) => image) };
  });
};

export const buildCases = () => {
  const fixture = JSON.parse(readFileSync(ROUTES, "utf8")).cases;
  const byOll = new Map(fixture.map(position => [position.oll, position]));
  const groups = readGroups(readFileSync(PRINT_GUIDE, "utf8"));

  if (groups.length !== GROUP_NAMES.length) {
    throw new Error(`print guide has ${groups.length} groups instead of ${GROUP_NAMES.length}`);
  }
  groups.forEach(({ name }, index) => {
    if (name !== GROUP_NAMES[index]) {
      throw new Error(`group ${index + 1} is "${name}", expected "${GROUP_NAMES[index]}" (booklet order changed)`);
    }
  });

  const positions = groups.flatMap(({ name: group, olls, images }) =>
    olls.map((oll, index) => {
      const position = byOll.get(oll);
      if (!position) throw new Error(`print guide names OLL ${oll} which the route fixture does not have`);
      if (position.image !== images[index]) {
        throw new Error(`OLL ${oll}: print guide shows ${images[index]}, route fixture maps ${position.image}`);
      }
      return {
        oll,
        name: position.name,
        image: `/${position.image}`,
        group,
        steps: position.steps,
        // `shape` is the OLL number of the position the cube is in *after* this
        // step, or 0 for solved. Route mode draws those checkpoints as the
        // chain the route walks through, so the game carries them verbatim.
        route: position.route.map(step => ({
          auf: normalizeAuf(step.auf),
          trigger: step.tool,
          shape: step.shape,
          // the booklet warns where a lane has fewer steps left than that shape's
          // own row needs: the picture is right, the row would be wrong
          warn: step.warn === true,
        })),
        simulatorUrl: position.href,
      };
    })
  );

  return { groups: GROUP_NAMES, positions };
};

/** Copies the 57 diagrams the positions reference and drops any diagram no longer referenced. */
const copyDiagrams = cases => {
  mkdirSync(DIAGRAMS, { recursive: true });
  const wanted = new Set(cases.positions.map(({ image }) => basename(image)));
  process.stdout.write(`copying ${wanted.size} diagrams\n`);
  for (const name of wanted) {
    const source = `${BOOKLET}/img/${name}`;
    if (!existsSync(source)) throw new Error(`booklet has no diagram ${source}`);
    copyFileSync(source, `${DIAGRAMS}/${name}`);
  }
  for (const name of readdirSync(DIAGRAMS)) {
    if (/^friedrich-oll-\d+\.png$/.test(name) && !wanted.has(name)) {
      rmSync(`${DIAGRAMS}/${name}`);
      process.stdout.write(`removed stale diagram ${name}\n`);
    }
  }
};

const serialize = cases => `${JSON.stringify(cases, null, 2)}\n`;

const main = () => {
  const check = process.argv.includes("--check");
  const cases = buildCases();

  if (!check) copyDiagrams(cases);

  assertCases(cases, { imageExists: image => existsSync(APP + image) });

  const serialized = serialize(cases);

  if (check) {
    const committed = existsSync(OUTPUT) ? readFileSync(OUTPUT, "utf8") : "";
    if (committed !== serialized) {
      throw new Error("cases.json is stale or hand-edited: run node scripts/generate-cases.mjs and commit the diff");
    }
    process.stdout.write(`cases.json is up to date (${cases.positions.length} positions)\n`);
    return;
  }

  writeFileSync(OUTPUT, serialized);
  process.stdout.write(`wrote ${OUTPUT} (${cases.positions.length} positions)\n`);
};

const invokedDirectly = process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
}
