// @ts-check
const { test, expect } = require('@playwright/test');

// the positions the app ships, so a test can know the answer the booklet gives
const cases = require('../../app/src/quiz/entity/cases.json');
const { gateOpen, open, signIn } = require('./support');

// the game is played on a phone, in portrait
test.use({ viewport: { width: 390, height: 844 } });

/**
 * The position on screen, read from the run card's `data-oll` — never from the
 * diagram's file name, and never from a class.
 */
const positionOnScreen = async page => {
  const oll = Number(await page.getByTestId('run').getAttribute('data-oll'));
  const position = cases.positions.find(candidate => candidate.oll === oll);
  if (!position) throw new Error(`no position ${oll}`);
  return position;
};

/** The trigger the booklet names for the position on screen. */
const expectedTrigger = async page => (await positionOnScreen(page)).route[0].trigger;

const optionFor = (page, trigger) => page.getByTestId(`answer-${trigger}`);
const optionCodes = async page => (await page.locator('[data-testid^="answer-"]').evaluateAll(
  elements => elements.map(element => element.getAttribute('data-testid'))))
  .map(testid => testid.replace('answer-', ''))
  .sort();

const score = page => page.getByTestId('run-score');
const progress = page => page.getByTestId('run-progress');
const next = page => page.getByTestId('next');

const revealSteps = (page, kind = 'trigger') =>
  page.locator(`[data-testid="reveal-step"][data-kind="${kind}"]`);

/** Starts a run the way a player does: name yourself, tap a mode card, start. */
const startRun = async (page, name = 'throwaway') => {
  await page.goto('localhost:3000');
  await signIn(page, name);
  await page.getByTestId('mode-toggle-random').click();
  await page.getByTestId('start-run').click();
  await expect(page.getByTestId('diagram')).toBeVisible();
};

/** Answers the current position correctly and moves on to the next one. */
const answerCorrectly = async page => {
  await optionFor(page, await expectedTrigger(page)).click();
  await next(page).click();
};

test('has title', async ({ page }) => {
  await open(page);

  await expect(page).toHaveTitle('Rubik triggers');
});

test('a first arrival is asked for a name before anything else', async ({ page }) => {
  await page.goto('localhost:3000');

  // the gate is a modal dialog: it covers the dashboard, and stays until named
  const gate = page.getByTestId('name-gate');
  await expect(gate).toBeVisible();
  expect(await gateOpen(page)).toBe(true);
  await expect(page.getByTestId('dashboard')).toBeVisible();
  await expect(page.getByTestId('diagram')).toHaveCount(0);

  // an empty or blank name does not open it
  await page.getByTestId('gate-continue').click();
  expect(await gateOpen(page)).toBe(true);
  await page.getByTestId('gate-name').fill('   ');
  await page.getByTestId('gate-continue').click();
  expect(await gateOpen(page)).toBe(true);

  // a name closes it, names the header, and unblocks the first run
  await page.getByTestId('gate-name').fill('ada');
  await page.getByTestId('gate-continue').click();
  expect(await gateOpen(page)).toBe(false);
  await expect(page.getByTestId('playing-as')).toHaveText(/playing as ada/);

  await page.getByTestId('mode-toggle-random').click();
  await expect(page.getByTestId('start-run')).toBeEnabled();
});

test('the name gate can be put off, and the dashboard then asks in its own line', async ({ page }) => {
  await page.goto('localhost:3000');
  await page.getByTestId('gate-later').click();
  expect(await gateOpen(page)).toBe(false);

  // nothing is lost by waiting: the hero says the score has no owner, and the
  // gate is one tap away again
  await expect(page.getByTestId('playing-as')).toHaveText(/no name yet/);
  await expect(page.getByTestId('hero-add-name')).toBeVisible();
  await page.getByTestId('mode-toggle-random').click();
  await expect(page.getByTestId('start-run')).toBeDisabled();

  await page.getByTestId('hero-add-name').click();
  expect(await gateOpen(page)).toBe(true);
  await page.getByTestId('gate-name').fill('ada');
  await page.getByTestId('gate-continue').click();
  await expect(page.getByTestId('playing-as')).toHaveText(/playing as ada/);
  await expect(page.getByTestId('start-run')).toBeEnabled();
});

test('the header name field closes once the name is in, instead of staying open', async ({ page }) => {
  await open(page);

  await page.getByTestId('change-name').click();
  await expect(page.getByTestId('name-input')).toBeVisible();
  // while typing, the field is what the header says: no duplicate "playing as" line
  await expect(page.getByTestId('playing-as')).toHaveCount(0);

  await page.getByTestId('name-input').fill('ada');
  await page.getByTestId('name-input').press('Enter');
  await expect(page.getByTestId('name-input')).toHaveCount(0);
  await expect(page.getByTestId('playing-as')).toHaveText(/playing as ada/);

  // leaving the field with a name in it closes it too
  await page.getByTestId('change-name').click();
  await page.getByTestId('name-input').fill('bea');
  await page.getByTestId('hero').click();
  await expect(page.getByTestId('name-input')).toHaveCount(0);
  await expect(page.getByTestId('playing-as')).toHaveText(/playing as bea/);
});

test('a run offers the first of 57 positions, four triggers and no case name', async ({ page }) => {
  await startRun(page, 'ada');

  await expect(page).toHaveURL(/\/run$/);
  await expect(progress(page)).toHaveText('1 / 57');
  await expect(score(page)).toHaveText('0 points');
  await expect(page.getByTestId('run-mode-level')).toHaveText('Random · Test');

  const diagram = page.getByTestId('diagram');
  await expect(diagram).toHaveAttribute('src', /^\/img\/friedrich-oll-\d+\.png$/);
  await expect(diagram).toHaveAttribute('width', '82');

  await expect(page.locator('[data-testid^="answer-"]')).toHaveCount(4);
  expect(await optionCodes(page)).toEqual(['AS', 'ET', 'S', 'WT']);

  // Test level: nothing identifying before the answer
  await expect(page.getByTestId('reveal')).toHaveCount(0);
  await expect(page.getByText(/OCLL/)).toHaveCount(0);
});

test('lays the question out in one card that fills the phone', async ({ page }) => {
  await startRun(page);

  const viewport = page.viewportSize();
  const card = page.getByTestId('run');
  const run = await card.boundingBox();
  // the card's own inset: its border plus its padding, the guide's `.card` rhythm
  const inset = await card.evaluate(node => {
    const style = getComputedStyle(node);
    return parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft);
  });

  // the phone, less the container's gutters
  expect(run.x).toBeCloseTo(16, 0);
  expect(run.width).toBeCloseTo(viewport.width - 32, 0);

  // and one column inside it, filling the card's content box
  for (const testid of ['run-status', 'question', 'answers']) {
    const box = await page.getByTestId(testid).boundingBox();
    expect(box.x, `${testid} is indented`).toBeCloseTo(run.x + inset, 0);
    expect(box.width, `${testid} is squeezed into a column`).toBeGreaterThan(run.width - 2 * inset - 1);
  }
});

test('the way on sits under the solving note, and one scroll reaches it', async ({ page }) => {
  await startRun(page);
  await optionFor(page, await expectedTrigger(page)).click();

  const note = await page.getByTestId('reveal').boundingBox();
  const nextBox = await next(page).boundingBox();
  // the ticket's order: the note teaches first, the way on follows it
  expect(nextBox.y).toBeGreaterThan(note.y);

  // and it is a thumb-sized control, never a clipped one
  expect(nextBox.height).toBeGreaterThanOrEqual(44);
  await next(page).scrollIntoViewIfNeeded();
  const reached = await next(page).boundingBox();
  const viewport = page.viewportSize();
  expect(reached.y).toBeGreaterThanOrEqual(0);
  expect(reached.y + reached.height).toBeLessThanOrEqual(viewport.height);
});

test('shows the diagram scaled, never cropped', async ({ page }) => {
  await startRun(page);

  const diagram = page.getByTestId('diagram');
  const natural = await diagram.evaluate(image => ({ width: image.naturalWidth, height: image.naturalHeight }));
  const box = await diagram.boundingBox();
  const viewport = page.viewportSize();

  expect(natural.width).toBeGreaterThan(0);
  expect(box.width / box.height).toBeCloseTo(natural.width / natural.height, 1);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 0.5);
});

test('offers thumb-sized tap targets', async ({ page }) => {
  await open(page);
  await signIn(page, 'throwaway');
  await page.getByTestId('mode-toggle-random').click();

  const start = await page.getByTestId('start-run').boundingBox();
  expect(start.height).toBeGreaterThanOrEqual(44);

  await page.getByTestId('start-run').click();
  await expect(page.getByTestId('diagram')).toBeVisible();
  await optionFor(page, await expectedTrigger(page)).click();

  const targets = await page.locator('[data-testid^="answer-"], [data-testid="next"], [data-testid="simulator"]')
    .evaluateAll(elements => elements.map(element => {
      const { width, height } = element.getBoundingClientRect();
      return { width, height };
    }));
  expect(targets.length).toBeGreaterThanOrEqual(5);
  for (const { width, height } of targets) {
    expect(height).toBeGreaterThanOrEqual(44);
    expect(width).toBeGreaterThanOrEqual(44);
  }
});

test('a correct answer is worth ten points and moves on', async ({ page }) => {
  await startRun(page);

  const trigger = await expectedTrigger(page);
  await optionFor(page, trigger).click();

  await expect(page.getByTestId('verdict')).toHaveAttribute('data-result', 'correct');
  await expect(optionFor(page, trigger)).toHaveAttribute('data-state', 'correct');
  await expect(score(page)).toHaveText('10 points');
  await expect(progress(page)).toHaveText('1 / 57');

  // the reveal follows every answer, hit or miss, so the position can be studied
  const reveal = page.getByTestId('reveal');
  await expect(reveal).toBeVisible();
  await expect(reveal.getByRole('heading')).not.toBeEmpty();
  expect((await revealSteps(page).first().innerText()).trim()).toBe(trigger);

  await next(page).click();

  await expect(progress(page)).toHaveText('2 / 57');
  await expect(score(page)).toHaveText('10 points');
  await expect(page.getByTestId('verdict')).toHaveCount(0);
  await expect(page.getByTestId('reveal')).toHaveCount(0);
  await expect(page.locator('[data-testid^="answer-"]:enabled')).toHaveCount(4);
});

test('a miss reveals the trigger that would have been right, and the position it solves', async ({ page }) => {
  await startRun(page);

  const trigger = await expectedTrigger(page);
  const wrong = ['S', 'AS', 'ET', 'WT'].find(candidate => candidate !== trigger);
  await optionFor(page, wrong).click();

  const verdict = page.getByTestId('verdict');
  await expect(verdict).toHaveAttribute('data-result', 'incorrect');
  await expect(verdict).toContainText(trigger);
  await expect(optionFor(page, wrong)).toHaveAttribute('data-state', 'wrong');
  await expect(score(page)).toHaveText('0 points');

  const reveal = page.getByTestId('reveal');
  await expect(reveal).toBeVisible();
  await expect(reveal.getByRole('heading')).not.toBeEmpty();
  await expect(reveal).toContainText('OLL');

  const steps = Number(await reveal.getAttribute('data-steps'));
  await expect(revealSteps(page)).toHaveCount(steps);
  expect((await revealSteps(page).first().innerText()).trim()).toBe(trigger);

  const simulator = page.getByTestId('simulator');
  const href = await simulator.getAttribute('href');
  expect(href).toMatch(/^https:\/\/alg\.cubing\.net\//);
  expect(href).toContain('puzzle=3x3x3');
  expect(href).toContain('setup=');

  await next(page).click();
  await expect(progress(page)).toHaveText('2 / 57');
  await expect(reveal).toHaveCount(0);
});

test('the ladder climbs 10, 30, 60, 100, 150 while the answers are right', async ({ page }) => {
  await startRun(page);

  const earned = [];
  for (const round of ['10 points', '30 points', '60 points', '100 points', '150 points']) {
    await optionFor(page, await expectedTrigger(page)).click();
    await expect(score(page)).toHaveText(round);
    earned.push(round);
    await next(page).click();
  }
  expect(earned).toEqual(['10 points', '30 points', '60 points', '100 points', '150 points']);
});

test('a miss puts the ladder back at the bottom', async ({ page }) => {
  await startRun(page);

  await answerCorrectly(page); // 10
  await optionFor(page, await expectedTrigger(page)).click(); // still on question 2
  await expect(score(page)).toHaveText('30 points');
  await next(page).click();

  // third question: answer it wrong, which scores nothing
  const trigger = await expectedTrigger(page);
  await optionFor(page, ['S', 'AS', 'ET', 'WT'].find(candidate => candidate !== trigger)).click();
  await expect(score(page)).toHaveText('30 points');
  await next(page).click();

  // the next correct answer is worth ten again
  await optionFor(page, await expectedTrigger(page)).click();
  await expect(score(page)).toHaveText('40 points');
});

test('a run survives a reload and is offered back on the dashboard', async ({ page }) => {
  await startRun(page, 'ada');
  await optionFor(page, await expectedTrigger(page)).click();
  await next(page).click();

  // the run view has its own address: a reload lands back in the question
  await page.reload();
  await expect(progress(page)).toHaveText('2 / 57');

  // and the dashboard offers the same run rather than a second start
  await page.getByTestId('nav-play').click();
  const openRun = page.getByTestId('open-run');
  await expect(openRun).toBeVisible();
  await expect(openRun).toContainText('Random · Test');
  await expect(page.getByTestId('open-run-progress')).toHaveText('2 / 57');
  await expect(page.getByTestId('open-run-started'))
    .toContainText(/^started (just now|\d+ (minute|hour|day|week)s? ago)$/);
  await expect(page.getByTestId('no-open-run')).toHaveCount(0);

  await page.getByTestId('continue-run').click();
  await expect(page).toHaveURL(/\/run$/);
  await expect(progress(page)).toHaveText('2 / 57');
});

test('a finished run shows score, correct count, accuracy and elapsed time', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'a full 57-position run is only run once');

  await startRun(page);

  for (let question = 1; question <= 57; question++) {
    await optionFor(page, await expectedTrigger(page)).click();
    await next(page).click();
  }

  const finish = page.getByTestId('finish');
  await expect(finish).toBeVisible();
  await expect(finish.getByRole('heading')).toHaveText('Run finished');
  await expect(finish).toHaveAttribute('data-correct', '57');
  await expect(finish).toHaveAttribute('data-total', '57');
  await expect(finish).toHaveAttribute('data-score', '2750');
  await expect(page.getByTestId('final-score')).toHaveText('2750');
  await expect(page.getByTestId('finish-correct')).toHaveText('57');
  await expect(page.getByTestId('finish-total')).toHaveText('57');
  await expect(page.getByTestId('finish-accuracy')).toHaveText('100%');
  await expect(page.getByTestId('finish-elapsed')).toHaveText(/\d+ s|\d+ min \d+ s/);

  // the picker lives on the dashboard now, so that is where the button goes
  await page.getByTestId('start-another').click();
  await expect(page).toHaveURL(/localhost:3000\/$/);
  await expect(page.getByTestId('dashboard')).toBeVisible();
  await expect(page.getByTestId('playing-as')).toHaveText(/playing as throwaway/);
  await expect(page.getByTestId('no-open-run')).toBeVisible();
  await expect(page.getByTestId('diagram')).toHaveCount(0);
});
