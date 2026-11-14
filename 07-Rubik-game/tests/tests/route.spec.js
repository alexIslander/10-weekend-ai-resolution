// @ts-check
const { test, expect } = require('@playwright/test');

// the positions the app ships, so a test can know the route of what it sees
const cases = require('../../app/src/quiz/entity/cases.json');

// the game is played on a phone, in portrait
test.use({ viewport: { width: 390, height: 844 } });

// the template's single persistence key
const KEY = 'rubik-game.localstorage.control';

const DAY = new Date(2026, 10, 14, 10, 0, 0).getTime();

const open = page => page.goto('localhost:3000');

const choose = (page, name) => page.getByRole('button', { name, exact: true }).click();

const optionFor = (page, trigger) => page.locator(`.option:has(.code:text-is("${trigger}"))`);

const chips = page => page.locator('.chosen .chip');
const submit = page => page.getByRole('button', { name: 'submit the route' });
const score = page => page.locator('.run-status .score');

const positionOnScreen = async page => {
  const image = await page.locator('img.diagram').getAttribute('src');
  const position = cases.positions.find(({ image: known }) => known === image);
  if (!position) throw new Error(`no position for diagram ${image}`);
  return position;
};

const triggersOf = position => position.route.map(step => step.trigger);

/** Starts a Route run under the given name, at the hint level the mode settles on. */
const startRoute = async (page, name = 'ada') => {
  await choose(page, 'Route');
  await page.getByLabel('Name').fill(name);
  await page.getByRole('button', { name: 'start the run' }).click();
  await expect(page.locator('.run')).toHaveAttribute('data-kind', 'route');
};

const tapAll = async (page, triggers) => {
  for (const trigger of triggers) await optionFor(page, trigger).click();
};

/**
 * The right route with one step too many: always wrong, whatever the position —
 * and never accidentally the right route when a route repeats a trigger.
 */
const overLongRoute = position => [...triggersOf(position), 'S'];

test('Route is a mode like the others, asking for the whole sequence at Test', async ({ page }) => {
  await open(page);
  await expect(page.getByRole('button', { name: 'Route' })).toHaveAttribute('aria-pressed', 'false');

  await choose(page, 'Route');
  await expect(page.getByRole('button', { name: 'Test' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.mode-line')).toHaveText('Route · Test · 57 positions');
  await expect(page.getByLabel('Group')).toHaveCount(0);

  await page.getByLabel('Name').fill('ada');
  await page.getByRole('button', { name: 'start the run' }).click();

  await expect(page.locator('.run-status .mode-level')).toHaveText('Route · Test');
  await expect(page.locator('.run h2')).toHaveText('Name the route, step by step');
  await expect(chips(page)).toHaveCount(0);
  await expect(submit(page)).toBeDisabled();
  await expect(page.locator('.option')).toHaveCount(4);
});

test('chips append in tap order, and nothing is judged before submit', async ({ page }) => {
  await open(page);
  await startRoute(page);

  await optionFor(page, 'S').click();
  await optionFor(page, 'AS').click();

  await expect(chips(page)).toHaveText(['S', 'AS']);
  await expect(page.locator('.verdict')).toHaveCount(0);
  await expect(page.locator('.reveal')).toHaveCount(0);
  await expect(page.locator('.option.correct, .option.wrong')).toHaveCount(0);
  await expect(page.locator('.run-status .score')).toHaveText('0 points');
  await expect(submit(page)).toBeEnabled();
});

test('the screen gives the route length away neither before nor during the answer', async ({ page }) => {
  await open(page);
  await startRoute(page);

  // the only counter on screen is the run's own progress
  await expect(page.locator('.run-status .progress')).toHaveText('1 / 57');
  await expect(page.locator('[data-steps]')).toHaveCount(0);
  await expect(page.locator('.reveal')).toHaveCount(0);

  await optionFor(page, 'ET').click();
  await expect(page.locator('[data-steps]')).toHaveCount(0);
  await expect(page.locator('.reveal')).toHaveCount(0);
});

test('the exact route is accepted, and the reveal shows every step with its turns', async ({ page }) => {
  await open(page);
  await startRoute(page);

  const position = await positionOnScreen(page);
  await tapAll(page, triggersOf(position));
  await submit(page).click();

  await expect(page.locator('.verdict')).toHaveAttribute('data-verdict', 'correct');
  await expect(score(page)).toHaveText('10 points');

  const reveal = page.locator('.reveal');
  await expect(reveal).toHaveAttribute('data-steps', String(position.steps));
  await expect(reveal.locator('.route li.trigger')).toHaveCount(position.steps);
  expect(await reveal.locator('.route li.trigger').allTextContents()).toEqual(triggersOf(position));
  // the AUF turns of the route are shown where the route has them
  await expect(reveal.locator('.route li.auf'))
    .toHaveCount(position.route.filter(step => step.auf !== 'none').length);

  // the answer is closed: no further chip can be added after submitting
  await expect(page.locator('.option:enabled')).toHaveCount(0);
});

test('a route with one step too many is wrong, and the whole route is revealed', async ({ page }) => {
  await open(page);
  await startRoute(page);

  const position = await positionOnScreen(page);
  await tapAll(page, overLongRoute(position));
  await submit(page).click();

  await expect(page.locator('.verdict')).toHaveAttribute('data-verdict', 'incorrect');
  await expect(page.locator('.verdict')).toContainText('the route is below');
  // all or nothing: a wrong route scores nothing at all
  await expect(score(page)).toHaveText('0 points');

  // the miss still teaches the whole route, with its AUF turns
  const reveal = page.locator('.reveal');
  await expect(reveal.locator('.route li.trigger')).toHaveCount(position.steps);
  expect(await reveal.locator('.route li.trigger').allTextContents()).toEqual(triggersOf(position));
  expect(await reveal.locator('.route li.auf').allTextContents())
    .toEqual(position.route.map(step => step.auf).filter(auf => auf !== 'none'));
  await expect(reveal).toContainText(`OLL ${position.oll}`);
});

test('a finished Route run lands on its own board, without retyping the name', async ({ page }) => {
  const position = cases.positions[0];
  const lastQuestion = {
    phase: 'running',
    mode: 'route',
    hintLevel: 'test',
    group: null,
    name: 'ada',
    questions: [{ kind: 'route', oll: position.oll, expected: triggersOf(position) }],
    index: 0,
    chips: [],
    given: null,
    score: 0,
    streak: 0,
    correct: 0,
    complete: false,
    startedAt: DAY,
    finishedAt: null
  };
  await page.goto('localhost:3000');
  await page.evaluate(([key, value]) => localStorage.setItem(key, JSON.stringify(value)), [KEY, { run: lastQuestion, players: {} }]);
  await page.reload();

  await tapAll(page, triggersOf(position));
  await submit(page).click();
  await page.getByRole('button', { name: 'see the result' }).click();

  const link = page.locator('.finish .board-link');
  await expect(link).toHaveAttribute('href', '/scores#board-route-test');
  await link.click();

  const board = page.locator('#board-route-test');
  await expect(board.locator('.board-row .name')).toHaveText(['ada']);
  await expect(board.locator('.board-row .score')).toHaveText(['10']);
});
