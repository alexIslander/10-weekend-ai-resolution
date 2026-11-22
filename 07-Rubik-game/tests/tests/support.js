// @ts-check
/**
 * The moves every spec makes before it can see anything: open the app, get past
 * the first-visit name gate, and put a name on the run.
 *
 * The gate is a modal dialog — it covers the page until it is answered — so a
 * spec that skips it sees a backdrop instead of a dashboard. `open` closes it,
 * and `signIn` uses it when it is there.
 */

// the template's single persistence key (app/src/app.config.js + StorageControl.js)
const KEY = 'rubik-game.localstorage.control';

/** Whether the gate is showing: a `<dialog>`, so `open` is the browser's own. */
const gateOpen = async page => {
  const gate = page.getByTestId('name-gate');
  if ((await gate.count()) === 0) return false;
  return gate.evaluate(dialog => /** @type {HTMLDialogElement} */ (dialog).open);
};

/** Opens a screen, with the first-visit gate out of the way. */
const open = async (page, path = '/') => {
  await page.goto(`localhost:3000${path}`);
  if (await gateOpen(page)) await page.getByTestId('gate-later').click();
};

/**
 * Names the player: through the gate when it is up, otherwise the header's
 * field, which is how a returning player changes one.
 */
const signIn = async (page, name = 'throwaway') => {
  if (await gateOpen(page)) {
    await page.getByTestId('gate-name').fill(name);
    await page.getByTestId('gate-continue').click();
    return;
  }
  await page.getByTestId('change-name').click();
  await page.getByTestId('name-input').fill(name);
  await page.getByTestId('name-input').press('Enter');
};

/** Puts a whole store state in localStorage, then loads the app from it. */
const seed = async (page, state, path = '/') => {
  await page.goto(`localhost:3000${path}`);
  await page.evaluate(([key, value]) => localStorage.setItem(key, JSON.stringify(value)), [KEY, state]);
  await page.reload();
  if (await gateOpen(page)) await page.getByTestId('gate-later').click();
};

/** The persisted store, as the spec that seeded it left it. */
const storedState = page => page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), KEY);

/** The position on screen, read from the run card's `data-oll`. */
const positionOnScreen = async (page, cases) => {
  const oll = Number(await page.getByTestId('run').getAttribute('data-oll'));
  const position = cases.positions.find(candidate => candidate.oll === oll);
  if (!position) throw new Error(`no position ${oll}`);
  return position;
};

module.exports = { KEY, gateOpen, open, signIn, seed, storedState, positionOnScreen };
