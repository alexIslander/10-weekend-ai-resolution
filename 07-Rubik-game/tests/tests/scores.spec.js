// @ts-check
const { test, expect } = require('@playwright/test');

// the positions the app ships, so a seeded run can know the answers
const cases = require('../../app/src/quiz/entity/cases.json');
const { seed: seedState, signIn, storedState } = require('./support');

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

const board = (page, hintLevel = 'test') => page.getByTestId(`board-random-${hintLevel}`);

const boardNames = page => board(page).getByTestId('board-row-name').allTextContents();

/**
 * Puts a whole store state in localStorage, the way the template persists it.
 * The app writes only on a dispatch, so the next load starts from this state;
 * nothing is seeded again on a reload.
 */
const seed = async (page, players, runState, path = '/') => {
  const state = runState ? { run: runState, players } : { players };
  await seedState(page, state, path);
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


const expectedTrigger = async page => {
  const oll = Number(await page.getByTestId('run').getAttribute('data-oll'));
  const position = cases.positions.find(candidate => candidate.oll === oll);
  if (!position) throw new Error(`no position ${oll}`);
  return position.route[0].trigger;
};

const optionFor = (page, trigger) => page.getByTestId(`answer-${trigger}`);

/** Starts a Random run from the dashboard. */
const startRun = async page => {
  await page.getByTestId('mode-toggle-random').click();
  await page.getByTestId('start-run').click();
  await expect(page.getByTestId('diagram')).toBeVisible();
};

test('the scores page is one tap from play and shows a board per hint level', async ({ page }) => {
  await seed(page, {
    ada: { name: 'ada', positions: {}, runs: [run({ score: 120, correct: 40 })] }
  });

  await page.getByTestId('nav-scores').click();

  await expect(page.getByTestId('scores-page')).toBeVisible();
  // ADR-0004: a mode on the scores page, with a board per hint level
  const random = page.getByTestId('scores-mode-random');
  await expect(random).toBeVisible();
  await expect(random.getByRole('heading')).toHaveText(['Random', 'Training', 'Test']);
  await expect(board(page, 'test').getByTestId('board-row')).toHaveCount(1);
  await expect(board(page, 'training').getByTestId('board-row')).toHaveCount(0);
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

  await expect(board(page).getByTestId('board-row')).toHaveCount(3);
  expect(await boardNames(page)).toEqual(['bob', 'ada', 'ada']);
  await expect(board(page).getByTestId('board-row-score')).toHaveText(['200', '200', '120']);
  // the tie-break is visible, so two equal scores are not an unexplained order
  await expect(board(page).getByTestId('board-row-elapsed')).toHaveText(['10 s', '30 s', '5 s']);
});

test('a board row shows name, score and the date the run finished', async ({ page }) => {
  await seed(page, {
    ada: { name: 'ada', positions: {}, runs: [run({ score: 120, correct: 40 })] }
  }, undefined, '/scores');

  const row = board(page).getByTestId('board-row').first();
  await expect(row.getByTestId('board-row-name')).toHaveText('ada');
  await expect(row.getByTestId('board-row-score')).toHaveText('120');
  await expect(row.getByTestId('board-row-date')).toHaveText('2026-11-14');
});

test('players, records and finished runs survive a reload', async ({ page }) => {
  await seed(page, {
    ada: {
      name: 'ada',
      positions: { 26: { attempts: 3, correct: 2, wrong: 1, lastSeenAt: DAY, streak: 1 } },
      runs: [run({ score: 120, correct: 40 })]
    }
  }, undefined, '/scores');
  await expect(board(page).getByTestId('board-row')).toHaveCount(1);
  const before = await storedState(page);

  await page.reload();

  await expect(board(page).getByTestId('board-row')).toHaveCount(1);
  expect(await storedState(page)).toEqual(before);
  expect(before.players.ada.positions['26'].attempts).toBe(3);
});

test('an abandoned run writes no score and lands on no board', async ({ page }) => {
  await seed(page, { ada: { name: 'ada', positions: {}, runs: [] } });

  await signIn(page, 'ada');
  await startRun(page);
  await optionFor(page, await expectedTrigger(page)).click();
  await page.getByTestId('nav-scores').click();

  await expect(board(page).getByTestId('board-row')).toHaveCount(0);
  expect((await storedState(page)).players.ada.runs).toEqual([]);
});

test('a reload in the middle of a run keeps the run, and still writes no score', async ({ page }) => {
  await seed(page, { ada: { name: 'ada', positions: {}, runs: [] } });

  await signIn(page, 'ada');
  await startRun(page);
  await optionFor(page, await expectedTrigger(page)).click();
  // the run view is its own address, so a reload resumes it in place
  await page.reload();

  await expect(page.getByTestId('run-progress')).toHaveText('1 / 57');
  await expect(page.getByTestId('run-score')).toHaveText('10 points');
  expect((await storedState(page)).players.ada.runs).toEqual([]);
});

test('the finish screen leads straight to the board of the run that just ended', async ({ page }) => {
  // a run in progress lives at its own address, not on the dashboard
  await seed(page, { ada: { name: 'ada', positions: {}, runs: [] } }, lastQuestionRun('ada'), '/run');

  await expect(page.getByTestId('run-progress')).toHaveText('57 / 57');
  await optionFor(page, await expectedTrigger(page)).click();
  await page.getByTestId('next').click();

  const link = page.getByTestId('board-link');
  await expect(link).toHaveAttribute('href', '/scores#board-random-test');
  await link.click();

  await expect(page).toHaveURL(/\/scores#board-random-test$/);
  const row = board(page).getByTestId('board-row').first();
  await expect(row.getByTestId('board-row-name')).toHaveText('ada');
  await expect(row.getByTestId('board-row-score')).toHaveText('10');
  await expect(row.getByTestId('board-row-date')).toHaveText(/^\d{4}-\d{2}-\d{2}$/);
});

test('skipping an open run takes its answers back out of the records', async ({ page }) => {
  const adaRun = run({ score: 120, correct: 40 });
  const positions = { 26: { attempts: 3, correct: 2, wrong: 1, lastSeenAt: DAY, streak: 1 } };
  await seed(page, { ada: { name: 'ada', positions, runs: [adaRun] } });

  // the stats page reads the name the next run would be recorded under
  await signIn(page, 'ada');
  // what the records add up to before the run that is about to be skipped
  await page.getByTestId('nav-stats').click();
  const totals = page.getByTestId('totals');
  const before = await totals.textContent();

  await page.getByTestId('nav-play').click();
  await startRun(page);
  for (let answered = 0; answered < 3; answered += 1) {
    await optionFor(page, await expectedTrigger(page)).click();
    await page.getByTestId('next').click();
  }
  await expect(page.getByTestId('run-progress')).toHaveText('4 / 57');

  // asking is not doing: a cancelled confirm leaves the run exactly where it was
  await page.getByTestId('skip-run').click();
  await expect(page.getByTestId('skip-confirm')).toContainText('3 answers');
  await page.getByTestId('cancel-skip').click();
  await expect(page.getByTestId('skip-confirm')).toHaveCount(0);
  await expect(page.getByTestId('run-progress')).toHaveText('4 / 57');

  await page.getByTestId('skip-run').click();
  await page.getByTestId('confirm-skip').click();

  // ADR-0005: the run is gone, and the dashboard offers the modes again
  await expect(page).toHaveURL(/localhost:3000\/$/);
  await expect(page.getByTestId('open-run')).toHaveCount(0);
  await expect(page.getByTestId('mode-toggle-random')).toBeVisible();

  await page.getByTestId('nav-stats').click();
  expect(await totals.textContent()).toEqual(before);
  await page.getByTestId('nav-scores').click();
  await expect(board(page).getByTestId('board-row')).toHaveCount(1);
  const state = await storedState(page);
  expect(state.players.ada.positions).toEqual(positions);
  expect(state.players.ada.runs).toEqual([adaRun]);
});

test('an open run can be skipped from the dashboard too', async ({ page }) => {
  await seed(page, { ada: { name: 'ada', positions: {}, runs: [] } });

  await signIn(page, 'ada');
  await startRun(page);
  await optionFor(page, await expectedTrigger(page)).click();
  await page.getByTestId('nav-play').click();

  await expect(page.getByTestId('open-run')).toBeVisible();
  await page.getByTestId('skip-run').click();
  await expect(page.getByTestId('skip-confirm')).toContainText('1 answer');
  await page.getByTestId('confirm-skip').click();

  // the one shared control: same words, same outcome, from either screen
  await expect(page.getByTestId('open-run')).toHaveCount(0);
  await expect(page.getByTestId('no-open-run')).toBeVisible();
  expect((await storedState(page)).players.ada.positions).toEqual({});
});

test('a second name writes into its own records and leaves the first alone', async ({ page }) => {
  const adaRun = run({ score: 120, correct: 40 });
  await seed(page, {
    ada: { name: 'ada', positions: {}, runs: [adaRun] }
  });

  await signIn(page, 'bob');
  await startRun(page);
  await optionFor(page, await expectedTrigger(page)).click();

  const state = await storedState(page);
  expect(Object.keys(state.players)).toEqual(['ada', 'bob']);
  expect(state.players.ada.runs).toEqual([adaRun]);
  expect(state.players.ada.positions).toEqual({});
  expect(Object.values(state.players.bob.positions)).toHaveLength(1);
  expect(state.players.bob.runs).toEqual([]);
});
