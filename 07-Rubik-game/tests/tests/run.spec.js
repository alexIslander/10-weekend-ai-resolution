// @ts-check
const { test, expect } = require('@playwright/test');

// the positions the app ships, so a test can know the answer the booklet gives
const cases = require('../../app/src/quiz/entity/cases.json');

// the game is played on a phone, in portrait
test.use({ viewport: { width: 390, height: 844 } });

const open = page => page.goto('localhost:3000');

/** The trigger the booklet names for the diagram on screen. */
const expectedTrigger = async page => {
  const image = await page.locator('img.diagram').getAttribute('src');
  const position = cases.positions.find(({ image: known }) => known === image);
  if (!position) throw new Error(`no position for diagram ${image}`);
  return position.route[0].trigger;
};

const optionFor = (page, trigger) => page.locator(`.option:has(.code:text-is("${trigger}"))`);

const score = page => page.locator('.run-status .score');
const progress = page => page.locator('.run-status .progress');
const next = page => page.locator('.run .next');

/** Starts a run under the given name. */
const startRun = async (page, name = 'throwaway') => {
  await open(page);
  await page.getByLabel('Name').fill(name);
  await page.getByRole('button', { name: 'start the run' }).click();
  await expect(page.locator('img.diagram')).toBeVisible();
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

test('asks for a name before the first question, and refuses an empty one', async ({ page }) => {
  await open(page);

  const name = page.getByLabel('Name');
  const start = page.getByRole('button', { name: 'start the run' });
  await expect(name).toBeVisible();
  await expect(start).toBeDisabled();
  await expect(page.locator('img.diagram')).toHaveCount(0);

  await name.fill('   ');
  await expect(start).toBeDisabled();
  await expect(page.locator('img.diagram')).toHaveCount(0);

  await name.fill('ada');
  await expect(start).toBeEnabled();
});

test('a run offers the first of 57 positions, four triggers and no case name', async ({ page }) => {
  await startRun(page, 'ada');

  await expect(progress(page)).toHaveText('1 / 57');
  await expect(score(page)).toHaveText('0 points');
  await expect(page.locator('.run-status .mode-level')).toHaveText('Random · Test');

  const diagram = page.getByRole('img', { name: /position diagram/i });
  await expect(diagram).toHaveAttribute('src', /^\/img\/friedrich-oll-\d+\.png$/);

  await expect(page.locator('.option')).toHaveCount(4);
  const codes = (await page.locator('.option .code').allTextContents()).map(code => code.trim()).sort();
  expect(codes).toEqual(['AS', 'ET', 'S', 'WT']);

  // Test level: nothing identifying before the answer
  await expect(page.locator('.reveal')).toHaveCount(0);
  await expect(page.getByText(/OCLL/)).toHaveCount(0);
});

test('lays the question out in one column that fills the phone', async ({ page }) => {
  await startRun(page);

  const run = await page.locator('.run').boundingBox();
  const question = await page.locator('.run h2').boundingBox();
  const options = await page.locator('.options').boundingBox();
  const status = await page.locator('.run-status').boundingBox();

  for (const [name, box] of [['question', question], ['options', options], ['status', status]]) {
    expect(box.width, `${name} is squeezed into a column`).toBeGreaterThan(run.width * 0.8);
    expect(box.x, `${name} starts at the left edge`).toBeCloseTo(run.x, 0);
  }
});

test('shows the diagram scaled, never cropped', async ({ page }) => {
  await startRun(page);

  const diagram = page.locator('img.diagram');
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
  const start = await page.getByRole('button', { name: 'start the run' }).boundingBox();
  expect(start.height).toBeGreaterThanOrEqual(44);

  await startRun(page);
  await optionFor(page, await expectedTrigger(page)).click();

  const targets = await page.locator('.option, .run .next, .reveal .simulator').evaluateAll(elements =>
    elements.map(element => {
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

  await expect(page.locator('.verdict')).toHaveAttribute('data-verdict', 'correct');
  await expect(page.locator('.option.correct .code')).toHaveText(trigger);
  await expect(score(page)).toHaveText('10 points');
  await expect(progress(page)).toHaveText('1 / 57');

  // the reveal follows every answer, hit or miss, so the position can be studied
  const reveal = page.locator('.reveal');
  await expect(reveal).toBeVisible();
  await expect(reveal.getByRole('heading')).not.toBeEmpty();
  expect((await page.locator('.route li.trigger').first().innerText()).trim()).toBe(trigger);

  await next(page).click();

  await expect(progress(page)).toHaveText('2 / 57');
  await expect(score(page)).toHaveText('10 points');
  await expect(page.locator('.verdict')).toHaveCount(0);
  await expect(page.locator('.reveal')).toHaveCount(0);
  await expect(page.locator('.option:enabled')).toHaveCount(4);
});

test('a miss reveals the trigger that would have been right, and the position it solves', async ({ page }) => {
  await startRun(page);

  const trigger = await expectedTrigger(page);
  const wrong = ['S', 'AS', 'ET', 'WT'].find(candidate => candidate !== trigger);
  await optionFor(page, wrong).click();

  const verdict = page.locator('.verdict');
  await expect(verdict).toHaveAttribute('data-verdict', 'incorrect');
  await expect(verdict).toContainText(trigger);
  await expect(score(page)).toHaveText('0 points');

  const reveal = page.locator('.reveal');
  await expect(reveal).toBeVisible();
  await expect(reveal.getByRole('heading')).not.toBeEmpty();
  await expect(reveal).toContainText('OLL');

  const steps = Number(await reveal.getAttribute('data-steps'));
  await expect(page.locator('.route li.trigger')).toHaveCount(steps);
  expect((await page.locator('.route li.trigger').first().innerText()).trim()).toBe(trigger);

  const simulator = reveal.getByRole('link', { name: /cube simulator/i });
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

test('a finished run shows score, correct count, accuracy and elapsed time', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'a full 57-position run is only run once');

  await startRun(page);

  for (let question = 1; question <= 57; question++) {
    await optionFor(page, await expectedTrigger(page)).click();
    await next(page).click();
  }

  const finish = page.locator('.finish');
  await expect(finish).toBeVisible();
  await expect(finish.getByRole('heading')).toHaveText('Run finished');
  await expect(finish).toHaveAttribute('data-correct', '57');
  await expect(finish).toHaveAttribute('data-total', '57');
  await expect(finish).toHaveAttribute('data-score', '2750');
  await expect(finish.locator('.final-score')).toHaveText('2750');
  await expect(finish).toContainText('57 of 57');
  await expect(finish).toContainText('100%');
  await expect(finish).toContainText(/\d+ s|\d+ min \d+ s/);

  await page.getByRole('button', { name: 'start another run' }).click();
  await expect(page.getByLabel('Name')).toHaveValue('throwaway');
  await expect(page.locator('img.diagram')).toHaveCount(0);
});
