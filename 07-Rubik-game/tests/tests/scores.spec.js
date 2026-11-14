// @ts-check
const { test, expect } = require('@playwright/test');

// the positions the app ships, so a seeded run can know the answers
const cases = require('../../app/src/quiz/entity/cases.json');

// the game is played on a phone, in portrait
test.use({ viewport: { width: 390, height: 844 } });

// the template's single persistence key (app/src/app.config.js + StorageControl.js)
const KEY = 'rubik-game.localstorage.control';

const DAY = new Date(2026, 10, 14, 10, 0, 0).getTime();

const run = ({ score, correct, startedAt = DAY, finishedAt = DAY + 30_000, mode = 'random', hintLevel = 'test' }) => ({
  mode,
  hintLevel,
  score,
  correct,
  total: 57,
  startedAt,
  finishedAt
});

const board = (page, hintLevel = 'test') => page.locator(`#board-random-${hintLevel}`);

const boardNames = page => board(page).locator('.board-row .name').allTextContents();

/**
 * Puts a whole store state in localStorage, the way the template persists it.
 * The app writes only on a dispatch, so the next load starts from this state;
 * nothing is seeded again on a reload.
 */
const seed = async (page, players, runState, path = '/') => {
  const state = runState ? { run: runState, players } : { players };
  await page.goto(`localhost:3000${path}`);
  await page.evaluate(([key, value]) => localStorage.setItem(key, JSON.stringify(value)), [KEY, state]);
  await page.reload();
};

/** A run that is one answer away from the finish screen. */
const lastQuestionRun = name => ({
  phase: 'running',
  mode: 'random',
  hintLevel: 'test',
  name,
  questions: cases.positions.map(position => ({
    oll: position.oll,
    expected: position.route[0].trigger,
    options: ['S', 'AS', 'ET', 'WT']
  })),
  index: cases.positions.length - 1,
  given: null,
  score: 0,
  streak: 0,
  correct: 0,
  complete: false,
  startedAt: DAY,
  finishedAt: null
});

const storedState = page => page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), KEY);

const expectedTrigger = async page => {
  const image = await page.locator('img.diagram').getAttribute('src');
  const position = cases.positions.find(({ image: known }) => known === image);
  if (!position) throw new Error(`no position for diagram ${image}`);
  return position.route[0].trigger;
};

const optionFor = (page, trigger) => page.locator(`.option:has(.code:text-is("${trigger}"))`);

test('the scores page is one tap from play and shows a board per hint level', async ({ page }) => {
  await seed(page, {
    ada: { name: 'ada', positions: {}, runs: [run({ score: 120, correct: 40 })] }
  });

  await page.getByRole('link', { name: 'scores' }).click();

  await expect(page.locator('.scores')).toBeVisible();
  // ADR-0004: a mode on the scores page, with a column per hint level
  const random = page.locator('.mode[data-mode="random"]');
  await expect(random).toBeVisible();
  await expect(random.locator('h3')).toHaveText('Random');
  await expect(random.locator('.board h4')).toHaveText(['Training', 'Test']);
  await expect(board(page, 'test').locator('.board-row')).toHaveCount(1);
  await expect(board(page, 'training').locator('.board-row')).toHaveCount(0);
  await expect(board(page, 'training')).toContainText('no finished runs yet');
});

test('a board ranks by score and the faster run wins a tie', async ({ page }) => {
  await seed(page, {
    ada: { name: 'ada', positions: {}, runs: [
      run({ score: 200, correct: 57, startedAt: DAY, finishedAt: DAY + 30_000 }),
      run({ score: 120, correct: 40, finishedAt: DAY + 5_000 })
    ] },
    bob: { name: 'bob', positions: {}, runs: [
      run({ score: 200, correct: 57, startedAt: DAY, finishedAt: DAY + 10_000 })
    ] },
    // a run of another mode and level is on another board, not this one
    cara: { name: 'cara', positions: {}, runs: [run({ score: 999, correct: 57, mode: 'grouped' })] }
  }, undefined, '/scores');

  await expect(board(page).locator('.board-row')).toHaveCount(3);
  expect(await boardNames(page)).toEqual(['bob', 'ada', 'ada']);
  await expect(board(page).locator('.board-row .score')).toHaveText(['200', '200', '120']);
  // the tie-break is visible, so two equal scores are not an unexplained order
  await expect(board(page).locator('.board-row .elapsed')).toHaveText(['10 s', '30 s', '5 s']);
});

test('a board row shows name, score and the date the run finished', async ({ page }) => {
  await seed(page, {
    ada: { name: 'ada', positions: {}, runs: [run({ score: 120, correct: 40 })] }
  }, undefined, '/scores');

  const row = board(page).locator('.board-row').first();
  await expect(row.locator('.name')).toHaveText('ada');
  await expect(row.locator('.score')).toHaveText('120');
  await expect(row.locator('.date')).toHaveText('2026-11-14');
});

test('players, records and finished runs survive a reload', async ({ page }) => {
  await seed(page, {
    ada: {
      name: 'ada',
      positions: { 26: { attempts: 3, correct: 2, wrong: 1, lastSeenAt: DAY, streak: 1 } },
      runs: [run({ score: 120, correct: 40 })]
    }
  }, undefined, '/scores');
  await expect(board(page).locator('.board-row')).toHaveCount(1);
  const before = await storedState(page);

  await page.reload();

  await expect(board(page).locator('.board-row')).toHaveCount(1);
  expect(await storedState(page)).toEqual(before);
  expect(before.players.ada.positions['26'].attempts).toBe(3);
});

test('an abandoned run writes no score and lands on no board', async ({ page }) => {
  await seed(page, { ada: { name: 'ada', positions: {}, runs: [] } });

  await page.getByLabel('Name').fill('ada');
  await page.getByRole('button', { name: 'start the run' }).click();
  await optionFor(page, await expectedTrigger(page)).click();
  await page.getByRole('link', { name: 'scores' }).click();

  await expect(board(page).locator('.board-row')).toHaveCount(0);
  expect((await storedState(page)).players.ada.runs).toEqual([]);
});

test('a reload in the middle of a run keeps the run, and still writes no score', async ({ page }) => {
  await seed(page, { ada: { name: 'ada', positions: {}, runs: [] } });

  await page.getByLabel('Name').fill('ada');
  await page.getByRole('button', { name: 'start the run' }).click();
  await optionFor(page, await expectedTrigger(page)).click();
  await page.reload();

  await expect(page.locator('.run-status .progress')).toHaveText('1 / 57');
  await expect(page.locator('.run-status .score')).toHaveText('10 points');
  expect((await storedState(page)).players.ada.runs).toEqual([]);
});

test('the finish screen leads straight to the board of the run that just ended', async ({ page }) => {
  await seed(page, { ada: { name: 'ada', positions: {}, runs: [] } }, lastQuestionRun('ada'));

  await expect(page.locator('.run-status .progress')).toHaveText('57 / 57');
  await optionFor(page, await expectedTrigger(page)).click();
  await page.getByRole('button', { name: 'see the result' }).click();

  const link = page.locator('.finish .board-link');
  await expect(link).toHaveAttribute('href', '/scores#board-random-test');
  await link.click();

  await expect(page).toHaveURL(/\/scores#board-random-test$/);
  const row = board(page).locator('.board-row').first();
  await expect(row.locator('.name')).toHaveText('ada');
  await expect(row.locator('.score')).toHaveText('10');
  await expect(row.locator('.date')).toHaveText(/^\d{4}-\d{2}-\d{2}$/);
});

test('a second name writes into its own records and leaves the first alone', async ({ page }) => {
  const adaRun = run({ score: 120, correct: 40 });
  await seed(page, {
    ada: { name: 'ada', positions: {}, runs: [adaRun] }
  });

  await page.getByLabel('Name').fill('bob');
  await page.getByRole('button', { name: 'start the run' }).click();
  await optionFor(page, await expectedTrigger(page)).click();

  const state = await storedState(page);
  expect(Object.keys(state.players)).toEqual(['ada', 'bob']);
  expect(state.players.ada.runs).toEqual([adaRun]);
  expect(state.players.ada.positions).toEqual({});
  expect(Object.values(state.players.bob.positions)).toHaveLength(1);
  expect(state.players.bob.runs).toEqual([]);
});
