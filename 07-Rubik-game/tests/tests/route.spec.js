// @ts-check
const { test, expect } = require('@playwright/test');

// the positions the app ships, so a test can know the route of what it sees
const cases = require('../../app/src/quiz/entity/cases.json');
const { open, signIn } = require('./support');

// the game is played on a phone, in portrait
test.use({ viewport: { width: 390, height: 844 } });

// the template's single persistence key
const KEY = 'rubik-game.localstorage.control';

const DAY = new Date(2026, 10, 14, 10, 0, 0).getTime();

const optionFor = (page, trigger) => page.getByTestId(`answer-${trigger}`);

const chips = page => page.getByTestId('chosen-step');
const submit = page => page.getByTestId('submit-route');
const score = page => page.getByTestId('run-score');
const progress = page => page.getByTestId('run-progress');

const revealSteps = (page, kind = 'trigger') =>
  page.locator(`[data-testid="reveal-step"][data-kind="${kind}"]`);

/** The position on screen, read from the run card's `data-oll`. */
const positionOnScreen = async page => {
  const oll = Number(await page.getByTestId('run').getAttribute('data-oll'));
  const position = cases.positions.find(candidate => candidate.oll === oll);
  if (!position) throw new Error(`no position ${oll}`);
  return position;
};

const triggersOf = position => position.route.map(step => step.trigger);

/** Starts a Route run from the dashboard, at the hint level the mode settles on. */
const startRoute = async (page, name = 'ada') => {
  await signIn(page, name);
  await page.getByTestId('mode-toggle-route').click();
  await page.getByTestId('start-run').click();
  await expect(page.getByTestId('run')).toHaveAttribute('data-kind', 'route');
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
  await expect(page.getByTestId('position-count')).toHaveCount(0);

  await signIn(page, 'ada');
  await page.getByTestId('mode-toggle-route').click();
  await expect(page.getByTestId('hint-test')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('position-count')).toHaveText('Route · Test · 57 positions');
  // Route offers its own sets: the four first-step lanes, on top of all 57
  await expect(page.getByTestId('set-select')).toBeVisible();

  await page.getByTestId('start-run').click();

  await expect(page.getByTestId('run-mode-level')).toHaveText('Route · Test');
  await expect(page.getByTestId('question')).toHaveText('Name the route, step by step');
  await expect(chips(page)).toHaveCount(0);
  await expect(submit(page)).toBeDisabled();
  await expect(page.locator('[data-testid^="answer-"]')).toHaveCount(4);
});

test('chips append in tap order, and a wrong first chip is not judged early', async ({ page }) => {
  await open(page);
  await startRoute(page);

  // a chip that cannot be right, then a second one: the screen still says nothing
  const position = await positionOnScreen(page);
  const first = ['S', 'AS', 'ET', 'WT'].find(trigger => trigger !== position.route[0].trigger);
  await optionFor(page, first).click();
  await optionFor(page, position.route[0].trigger).click();

  await expect(chips(page)).toHaveText([first, position.route[0].trigger]);
  await expect(page.getByTestId('verdict')).toHaveCount(0);
  await expect(page.getByTestId('reveal')).toHaveCount(0);
  await expect(page.locator('[data-state="correct"], [data-state="wrong"]')).toHaveCount(0);
  await expect(score(page)).toHaveText('0 points');
  await expect(submit(page)).toBeEnabled();
});

test('Route draws the shape chain above the answer, empty until the route is submitted', async ({ page }) => {
  await open(page);
  await startRoute(page);

  const position = await positionOnScreen(page);

  // the map: one box per step, one checkpoint shape fewer, then solved
  const chain = page.getByTestId('route-chain');
  await expect(chain).toHaveAttribute('data-steps', String(position.steps));
  await expect(chain.getByTestId('chain-step')).toHaveCount(position.steps);
  await expect(chain.getByTestId('chain-shape')).toHaveCount(position.steps - 1);
  await expect(chain.getByTestId('chain-solved')).toHaveCount(1);
  await expect(page.getByTestId('chain-caption'))
    .toContainText(position.steps === 1 ? '1 step' : `${position.steps} steps`);

  // at Test the checkpoints are pictures and nothing else: no trigger is given away
  const stepText = await chain.getByTestId('chain-step').allTextContents();
  expect(stepText.map(text => text.trim())).toEqual(position.route.map((_, index) => String(index + 1)));
  if (position.steps > 1) {
    await expect(chain.getByTestId('chain-shape').first().locator('img')).toHaveAttribute('alt', 'checkpoint shape');
  }
  await expect(page.getByTestId('reveal')).toHaveCount(0);

  // a tapped chip is the answer being typed, not a claim the map makes
  await optionFor(page, 'ET').click();
  await expect(chain.getByTestId('chain-step').first()).toHaveText('1');
  await expect(page.getByTestId('reveal')).toHaveCount(0);

  // and after submit the map carries the route, turns and all
  await submit(page).click();
  const filled = await chain.getByTestId('chain-step').allTextContents();
  expect(filled.map(text => text.trim())).toEqual(
    position.route.map(step => step.auf === 'none' ? step.trigger : `${step.auf} + ${step.trigger}`));
});

test('a Route run started from a first-step lane only asks that lane', async ({ page }) => {
  await open(page);
  await signIn(page, 'ada');
  await page.getByTestId('mode-toggle-route').click();
  await page.getByTestId('set-select').selectOption('ET');
  await expect(page.getByTestId('position-count')).toHaveText('Route · Test · 18 positions');

  await page.getByTestId('start-run').click();
  await expect(page.getByTestId('run-progress')).toHaveText('1 / 18');
  for (let question = 0; question < 4; question++) {
    expect((await positionOnScreen(page)).route[0].trigger).toBe('ET');
    await optionFor(page, 'ET').click();
    await submit(page).click();
    await page.getByTestId('next').click();
  }
});

test('a route submitted too short is wrong, and the whole route is still revealed', async ({ page }) => {
  await open(page);
  await startRoute(page);

  const position = await positionOnScreen(page);
  const triggers = triggersOf(position);

  if (triggers.length === 1) {
    // a one-step position has no shorter route to submit: the button waits for the chip
    await expect(submit(page)).toBeDisabled();
    await optionFor(page, triggers[0]).click();
    await expect(submit(page)).toBeEnabled();
    return;
  }

  await tapAll(page, triggers.slice(0, -1));
  await submit(page).click();

  await expect(page.getByTestId('verdict')).toHaveAttribute('data-result', 'incorrect');
  await expect(score(page)).toHaveText('0 points');
  expect(await revealSteps(page).allTextContents()).toEqual(triggers);
});

test('the exact route is accepted, and the reveal shows every step with its turns', async ({ page }) => {
  await open(page);
  await startRoute(page);

  const position = await positionOnScreen(page);
  await tapAll(page, triggersOf(position));
  await submit(page).click();

  await expect(page.getByTestId('verdict')).toHaveAttribute('data-result', 'correct');
  await expect(score(page)).toHaveText('10 points');

  const reveal = page.getByTestId('reveal');
  await expect(reveal).toHaveAttribute('data-steps', String(position.steps));
  await expect(revealSteps(page)).toHaveCount(position.steps);
  expect(await revealSteps(page).allTextContents()).toEqual(triggersOf(position));
  // the AUF turns of the route are shown where the route has them
  await expect(revealSteps(page, 'auf'))
    .toHaveCount(position.route.filter(step => step.auf !== 'none').length);

  // the answer is closed: no further chip can be added after submitting
  await expect(page.locator('[data-testid^="answer-"]:enabled')).toHaveCount(0);
});

test('a route with one step too many is wrong, and the whole route is revealed', async ({ page }) => {
  await open(page);
  await startRoute(page);

  const position = await positionOnScreen(page);
  await tapAll(page, overLongRoute(position));
  await submit(page).click();

  await expect(page.getByTestId('verdict')).toHaveAttribute('data-result', 'incorrect');
  await expect(page.getByTestId('verdict')).toContainText('the route is below');
  // all or nothing: a wrong route scores nothing at all
  await expect(score(page)).toHaveText('0 points');

  // the miss still teaches the whole route, with its AUF turns
  const reveal = page.getByTestId('reveal');
  await expect(revealSteps(page)).toHaveCount(position.steps);
  expect(await revealSteps(page).allTextContents()).toEqual(triggersOf(position));
  expect(await revealSteps(page, 'auf').allTextContents())
    .toEqual(position.route.map(step => step.auf).filter(auf => auf !== 'none'));
  await expect(reveal).toContainText(`OLL ${position.oll}`);
});

test('a finished Route run lands on its own board, without retyping the name', async ({ page }) => {
  const position = cases.positions[0];
  const lastQuestion = {
    phase: 'running',
    mode: 'route',
    hintLevel: 'test',
    set: 'all',
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
  // a run in progress has its own address; the dashboard only offers it back
  await page.goto('localhost:3000/run');

  await tapAll(page, triggersOf(position));
  await submit(page).click();
  await page.getByTestId('next').click();

  const link = page.getByTestId('board-link');
  await expect(link).toHaveAttribute('href', '/scores#board-route-test');
  await link.click();

  const board = page.getByTestId('board-route-test');
  await expect(board.getByTestId('board-row-name')).toHaveText(['ada']);
  await expect(board.getByTestId('board-row-score')).toHaveText(['10']);

  // and the finished run reaches the stats like any other mode's
  await page.getByTestId('nav-stats').click();
  await expect(page.getByTestId('mode-route-runs')).toHaveText('1');
  await expect(page.getByTestId('mode-route-accuracy')).toHaveText('100%');
  await expect(page.getByTestId('mode-route-best')).toHaveText('10');
  await expect(page.getByTestId('total-runs')).toHaveText('1');
});
