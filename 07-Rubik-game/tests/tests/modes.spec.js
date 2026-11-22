// @ts-check
const { test, expect } = require('@playwright/test');

// the positions the app ships, so a test can know what it should be asked
const cases = require('../../app/src/quiz/entity/cases.json');
const { open, signIn } = require('./support');

// the game is played on a phone, in portrait
test.use({ viewport: { width: 390, height: 844 } });

// the eight practice sets Grouped offers, as the core derives them
const practiceSets = [
  { id: 'All Edges Oriented Correctly', count: 7 },
  { id: 'T-Shapes · Squares · C-Shapes', count: 6 },
  { id: 'W-Shapes · Corners Correct, Edges Flipped · P-Shapes', count: 8 },
  { id: 'I-Shapes · Fish Shapes', count: 8 },
  { id: 'Knight Move Shapes · Awkward Shapes', count: 8 },
  { id: 'L-Shapes', count: 6 },
  { id: 'Lightning Bolts', count: 6 },
  { id: 'No Edges Flipped Correctly', count: 8 }
];

const setOptions = practiceSets.map(set => `${set.id} · ${set.count}`);

/** The position on screen, read from the run card's `data-oll` — never from a file name. */
const positionOnScreen = async page => {
  const oll = Number(await page.getByTestId('run').getAttribute('data-oll'));
  const position = cases.positions.find(candidate => candidate.oll === oll);
  if (!position) throw new Error(`no position ${oll}`);
  return position;
};

const optionFor = (page, trigger) => page.getByTestId(`answer-${trigger}`);

const revealSteps = page => page.locator('[data-testid="reveal-step"][data-kind="trigger"]');

/** Taps the trigger the booklet names, without leaving the question. */
const answerCorrectly = async page => {
  const { route } = await positionOnScreen(page);
  await optionFor(page, route[0].trigger).click();
};

const advance = page => page.getByTestId('next').click();

/** Opens a mode's card — if it is not already open — and starts a run of it. */
const startRun = async (page, { mode = 'random', hint, set } = {}) => {
  const toggle = page.getByTestId(`mode-toggle-${mode}`);
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
  if (hint) await page.getByTestId(`hint-${hint}`).click();
  if (set) await page.getByTestId('set-select').selectOption(set);
  await page.getByTestId('start-run').click();
  await expect(page.getByTestId('diagram')).toBeVisible();
};

test('the dashboard offers a card per shipping mode, and none for the modes still to come', async ({ page }) => {
  await open(page);

  for (const mode of ['random', 'grouped', 'progressive', 'route']) {
    await expect(page.getByTestId(`mode-card-${mode}`)).toBeVisible();
  }
  // AUF and Adaptive keep their colours and glyphs reserved, but ask for nothing
  await expect(page.getByTestId('mode-card-auf')).toHaveCount(0);
  await expect(page.getByTestId('mode-card-adaptive')).toHaveCount(0);

  // nothing is picked, and the hero says so in one line
  await expect(page.getByTestId('no-open-run')).toHaveText(/no open run/);
  await expect(page.getByTestId('position-count')).toHaveCount(0);
  await expect(page.getByTestId('start-run')).toHaveCount(0);
});

test('tapping a card opens its picker inside the card, one card at a time', async ({ page }) => {
  await open(page);
  await signIn(page);

  // the whole card is the target, not just its title
  await page.getByTestId('mode-card-random').click();
  await expect(page.getByTestId('position-count')).toHaveText('Random · Test · 57 positions');
  await expect(page.getByTestId('hint-test')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('set-select')).toHaveCount(0);

  // a second card closes the first: one picker, one start
  await page.getByTestId('mode-toggle-grouped').click();
  await expect(page.getByTestId('set-select')).toBeVisible();
  await expect(page.getByTestId('start-run')).toHaveCount(1);
  await expect(page.getByTestId('mode-card-random').getByTestId('start-run')).toHaveCount(0);

  // and the open card closes again on a second tap
  await page.getByTestId('mode-toggle-grouped').click();
  await expect(page.getByTestId('start-run')).toHaveCount(0);
});

test('opening a card does not reflow the grid', async ({ page }) => {
  // the four cards share a row here, which is where a reflow would be visible
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  await signIn(page);

  const route = page.getByTestId('mode-card-route');
  const before = await route.boundingBox();

  await page.getByTestId('mode-toggle-random').click();
  await expect(page.getByTestId('start-run')).toBeVisible();

  const after = await route.boundingBox();
  // the open card grows inside its own cell: its neighbours keep size and place
  expect(after.x).toBeCloseTo(before.x, 0);
  expect(after.y).toBeCloseTo(before.y, 0);
  expect(after.width).toBeCloseTo(before.width, 0);
  expect(after.height).toBeCloseTo(before.height, 0);

  // one column on the phone: the cards below move down, but never narrow
  await page.setViewportSize({ width: 390, height: 844 });
  const narrow = await route.boundingBox();
  const hero = await page.getByTestId('hero').boundingBox();
  expect(narrow.x).toBeCloseTo(hero.x, 0);
  expect(narrow.width).toBeCloseTo(hero.width, 0);
});

test('Grouped offers eight practice sets of six to eight positions, and runs exactly the chosen one', async ({ page }) => {
  await open(page);
  await signIn(page);
  await page.getByTestId('mode-toggle-grouped').click();

  const sets = page.getByTestId('set-select');
  await expect(sets.locator('option')).toHaveText(setOptions);
  await expect(sets).toHaveValue(practiceSets[0].id);
  await expect(page.getByTestId('position-count')).toHaveText('Grouped · Test · 7 positions');

  const set = practiceSets[1];
  await sets.selectOption(set.id);
  await expect(page.getByTestId('position-count')).toHaveText(`Grouped · Test · ${set.count} positions`);

  await startRun(page, { mode: 'grouped', set: set.id });

  await expect(page.getByTestId('run-progress')).toHaveText(`1 / ${set.count}`);
  await expect(page.getByTestId('run-mode-level')).toHaveText('Grouped · Test');
  expect(set.id).toContain((await positionOnScreen(page)).group);

  await answerCorrectly(page);
  await advance(page);
  await expect(page.getByTestId('run-progress')).toHaveText(`2 / ${set.count}`);
  expect(set.id).toContain((await positionOnScreen(page)).group);
});

test('Progressive defaults to Training and walks one-step positions first', async ({ page }) => {
  await open(page);
  await signIn(page);
  await page.getByTestId('mode-toggle-progressive').click();

  await expect(page.getByTestId('hint-training')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('position-count')).toHaveText('Progressive · Training · 57 positions');

  await startRun(page, { mode: 'progressive', hint: 'training' });
  await expect(page.getByTestId('run-mode-level')).toHaveText('Progressive · Training');

  const steps = [];
  for (let question = 0; question < 5; question++) {
    steps.push((await positionOnScreen(page)).steps);
    await answerCorrectly(page);
    await advance(page);
  }
  // the four one-step positions, then the first two-step one
  expect(steps).toEqual([1, 1, 1, 1, 2]);
});

test('a hint level can be overridden for any mode', async ({ page }) => {
  await open(page);
  await signIn(page);

  await page.getByTestId('mode-toggle-random').click();
  await page.getByTestId('hint-training').click();
  await expect(page.getByTestId('hint-test')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('position-count')).toHaveText('Random · Training · 57 positions');

  // another mode starts at its own default again
  await page.getByTestId('mode-toggle-grouped').click();
  await expect(page.getByTestId('hint-test')).toHaveAttribute('aria-pressed', 'true');
});

test('Training keeps the case name and OLL number on screen while asking', async ({ page }) => {
  await open(page);
  await signIn(page, 'ada');
  await startRun(page, { mode: 'random', hint: 'training' });

  const position = await positionOnScreen(page);
  const hint = page.getByTestId('training-hint');
  await expect(hint).toHaveAttribute('data-oll', String(position.oll));
  await expect(hint).toContainText(position.name);
  await expect(hint).toContainText(`OLL ${position.oll}`);
  // only the name and the number: the group and step count wait for the answer
  await expect(page.getByText(position.group, { exact: true })).toHaveCount(0);

  // the reveal after an answer is the same material as at Test
  await answerCorrectly(page);
  const reveal = page.getByTestId('reveal');
  await expect(reveal.getByRole('heading')).toHaveText(position.name);
  await expect(reveal).toContainText(`OLL ${position.oll}`);
  await expect(reveal).toContainText(position.group);
  await expect(revealSteps(page)).toHaveCount(position.steps);
});

test('Test shows nothing identifying before the answer, and the same reveal after it', async ({ page }) => {
  await open(page);
  await signIn(page, 'ada');
  await startRun(page);

  const position = await positionOnScreen(page);
  await expect(page.getByTestId('training-hint')).toHaveCount(0);
  await expect(page.getByTestId('reveal')).toHaveCount(0);
  await expect(page.getByText(position.name, { exact: true })).toHaveCount(0);
  await expect(page.getByText(`OLL ${position.oll}`)).toHaveCount(0);

  await answerCorrectly(page);
  const reveal = page.getByTestId('reveal');
  await expect(reveal).toHaveAttribute('data-oll', String(position.oll));
  await expect(reveal.getByRole('heading')).toHaveText(position.name);
  await expect(reveal).toContainText(`OLL ${position.oll}`);
  await expect(reveal).toContainText(position.group);
  await expect(revealSteps(page)).toHaveCount(position.steps);
  await expect(reveal.getByRole('link', { name: /cube simulator/i })).toBeVisible();
  // the question itself stays free of everything the reveal carries
  await expect(page.getByTestId('training-hint')).toHaveCount(0);
});

test('a finished run of a mode leaves a green check and its accuracy on the card', async ({ page }) => {
  await open(page);
  await signIn(page, 'ada');

  // the T-Shapes · Squares · C-Shapes set at Training is six positions
  const set = practiceSets[1].id;
  await startRun(page, { mode: 'grouped', set, hint: 'training' });

  for (let question = 0; question < practiceSets[1].count; question++) {
    await answerCorrectly(page);
    await advance(page);
  }
  await expect(page.getByTestId('finish')).toBeVisible();

  await page.getByTestId('start-another').click();

  await expect(page.getByTestId('finished-badge-grouped')).toBeVisible();
  await expect(page.getByTestId('mode-accuracy-grouped')).toHaveText('100%');
  // the mode with no finished run still says so, and wears no check
  await expect(page.getByTestId('mode-accuracy-random')).toHaveText('not played');
  await expect(page.getByTestId('finished-badge-random')).toHaveCount(0);
});

test('the scores page holds a board per mode and hint level', async ({ page }) => {
  await open(page);
  await page.getByTestId('nav-scores').click();

  for (const mode of ['random', 'grouped', 'progressive', 'route']) {
    await expect(page.getByTestId(`scores-mode-${mode}`).getByRole('heading', { level: 3 }))
      .toHaveText(mode.charAt(0).toUpperCase() + mode.slice(1));
    await expect(page.getByTestId(`board-${mode}-training`).getByRole('heading')).toHaveText('Training');
    await expect(page.getByTestId(`board-${mode}-test`).getByRole('heading')).toHaveText('Test');
  }
  await expect(page.getByTestId('board-empty')).toHaveCount(8);
  await expect(page.getByTestId('board-empty').first()).toHaveText('no finished runs yet');
});
