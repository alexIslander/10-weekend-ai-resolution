// @ts-check
/**
 * What a player can learn from the dashboard without asking anyone: what the
 * game is, what the four triggers are, what a mode will ask them, and what the
 * Route map shows. These are the screens' promises to a first visit.
 */
const { test, expect } = require('@playwright/test');

const cases = require('../../app/src/quiz/entity/cases.json');
const { gateOpen, open, signIn, seed } = require('./support');

// the game is played on a phone, in portrait
test.use({ viewport: { width: 390, height: 844 } });

const DAY = new Date(2026, 10, 14, 10, 0, 0).getTime();

/** A stored run slice: the picker's defaults, under a name. */
const idle = name => ({
  phase: 'idle',
  mode: 'random',
  hintLevel: 'test',
  set: null,
  name,
  questions: [],
  index: 0,
  chips: [],
  given: null,
  score: 0,
  streak: 0,
  correct: 0,
  complete: false,
  startedAt: null,
  finishedAt: null,
  snapshot: {}
});

const finishedRun = { mode: 'random', hintLevel: 'test', score: 120, correct: 40, total: 57, startedAt: DAY, finishedAt: DAY + 30_000 };

/** A player who has been here before: a name, a finished run, no open run. */
const returning = async page => {
  await seed(page, { run: idle('ada'), players: { ada: { name: 'ada', positions: {}, runs: [finishedRun] } } });
};

/** A two-step case whose first step lands on a checkpoint shape: OCLL4 → OCLL6. */
const TWO_STEP = cases.positions.find(position => position.oll === 24);

/** A Route run, one question long, on that case. */
const routeRun = hintLevel => ({
  phase: 'running',
  mode: 'route',
  hintLevel,
  set: 'all',
  name: 'ada',
  questions: [{ kind: 'route', oll: TWO_STEP.oll, expected: TWO_STEP.route.map(step => step.trigger) }],
  index: 0,
  chips: [],
  given: null,
  score: 0,
  streak: 0,
  correct: 0,
  complete: false,
  startedAt: DAY,
  finishedAt: null
});

test('the first visit is asked for a name, and can put the question off', async ({ page }) => {
  await page.goto('localhost:3000');

  const gate = page.getByTestId('name-gate');
  await expect(gate).toBeVisible();
  await expect(gate).toHaveAttribute('aria-labelledby', 'gate-title');
  await expect(gate.getByRole('heading')).toHaveText('what should we call you?');
  await expect(page.getByTestId('gate-name')).toBeFocused();

  // "later" is not a trap: the dashboard's own line takes over
  await page.getByTestId('gate-later').click();
  expect(await gateOpen(page)).toBe(false);
  await expect(page.getByTestId('hero-add-name')).toBeVisible();
});

test('a first visit is taught how a run works, and what the four triggers are', async ({ page }) => {
  await page.goto('localhost:3000');
  await page.getByTestId('gate-later').click();

  // both cards open by themselves when there is nothing to remember yet
  const how = page.getByTestId('how-it-works');
  await expect(how).toBeVisible();
  await expect(how).toHaveJSProperty('open', true);
  await expect(how).toContainText('Position');
  await expect(how).toContainText('Practice set');
  await expect(how).toContainText('Training');
  await expect(how).toContainText('10 points');

  const triggers = page.getByTestId('triggers');
  await expect(triggers).toHaveJSProperty('open', true);
  const rows = triggers.locator('.trigger-row');
  await expect(rows).toHaveCount(4);
  for (const [code, name, alg] of [
    ['S', 'Sune', "R U R' U R U2' R'"],
    ['AS', 'Anti-Sune', "R U2' R' U' R U' R'"],
    ['ET', 'Edge Trigger', "F R U R' U' F'"],
    ['WT', 'Wide Edge Trigger', "f R U R' U' f'"]
  ]) {
    const row = page.getByTestId(`trigger-${code}`);
    await expect(row).toContainText(name);
    await expect(row.locator('code')).toHaveText(alg);
  }
  // and the guide the drills come from is one link away
  await expect(triggers.getByRole('link', { name: 'rubik.csete.cc' })).toHaveAttribute('href', 'https://rubik.csete.cc/');
});

test('the teaching cards fold away for a player who already has history, and reopen on a tap', async ({ page }) => {
  await returning(page);

  const how = page.getByTestId('how-it-works');
  await expect(how).toHaveJSProperty('open', false);
  await expect(page.getByTestId('triggers')).toHaveJSProperty('open', false);

  await how.locator('summary').click();
  await expect(how).toHaveJSProperty('open', true);
  await how.locator('summary').click();
  await expect(how).toHaveJSProperty('open', false);
});

test('each mode card says the rule it plays by before it is tapped', async ({ page }) => {
  await open(page);

  await expect(page.getByTestId('mode-card-random')).toContainText('all 57, shuffled');
  await expect(page.getByTestId('mode-card-grouped')).toContainText('one practice set');
  await expect(page.getByTestId('mode-card-progressive')).toContainText('one step, then two, then three');
  await expect(page.getByTestId('mode-card-route')).toContainText('the whole route');
});

test('Grouped offers only sets big enough to rehearse', async ({ page }) => {
  await open(page);
  await signIn(page, 'ada');
  await page.getByTestId('mode-toggle-grouped').click();

  const options = await page.getByTestId('set-select').locator('option').allTextContents();
  expect(options).toHaveLength(8);
  for (const option of options) {
    const count = Number(option.trim().split('·').at(-1));
    expect(count).toBeGreaterThanOrEqual(6);
    expect(count).toBeLessThanOrEqual(8);
  }
  // and the picker says why the groups were paired
  await expect(page.getByTestId('mode-card-grouped')).toContainText('at least six positions');
});

test('Route offers a first-step lane per trigger, with the counts the guide prints', async ({ page }) => {
  await open(page);
  await signIn(page, 'ada');
  await page.getByTestId('mode-toggle-route').click();

  const options = page.getByTestId('set-select').locator('option');
  await expect(options).toHaveText([
    'All positions · 57',
    'Starts with Sune (S) · 12',
    'Starts with Anti-Sune (AS) · 8',
    'Starts with Edge Trigger (ET) · 18',
    'Starts with Wide Edge Trigger (WT) · 19'
  ]);
  // the lane's count follows the picker's own line
  await page.getByTestId('set-select').selectOption('AS');
  await expect(page.getByTestId('position-count')).toHaveText('Route · Test · 8 positions');
});

test('at Test the Route map shows the shapes and nothing else; at Training it names them', async ({ page }) => {
  const checkpoint = cases.positions.find(position => position.oll === TWO_STEP.route[0].shape);

  await seed(page, { run: routeRun('test'), players: {} }, '/run');
  const testChain = page.getByTestId('route-chain');
  await expect(testChain.getByTestId('chain-shape')).toHaveCount(1);
  await expect(testChain.getByTestId('chain-shape').locator('img')).toHaveAttribute('alt', 'checkpoint shape');
  await expect(testChain).not.toContainText(checkpoint.name);
  // the step count is on the map, the triggers are not
  await expect(page.getByTestId('chain-caption')).toContainText('2 steps');
  await expect(testChain.getByTestId('chain-step').first()).toHaveText('1');

  await seed(page, { run: routeRun('training'), players: {} }, '/run');
  const trainingChain = page.getByTestId('route-chain');
  await expect(trainingChain.getByTestId('chain-shape').locator('img')).toHaveAttribute('alt', checkpoint.name);
  await expect(trainingChain.getByTestId('chain-shape')).toContainText(checkpoint.name);
  // Training also names the position being asked, above the diagram
  await expect(page.getByTestId('training-hint')).toContainText(TWO_STEP.name);
});
