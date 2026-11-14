// @ts-check
const { test, expect } = require('@playwright/test');

// the positions the app ships, so a test can know what it should be asked
const cases = require('../../app/src/quiz/entity/cases.json');

// the game is played on a phone, in portrait
test.use({ viewport: { width: 390, height: 844 } });

const groups = cases.groups;

const open = page => page.goto('localhost:3000');

const choose = (page, name) => page.getByRole('button', { name, exact: true }).click();

const modeLine = page => page.locator('.mode-line');

const start = async (page, name = 'throwaway') => {
  await page.getByLabel('Name').fill(name);
  await page.getByRole('button', { name: 'start the run' }).click();
  await expect(page.locator('img.diagram')).toBeVisible();
};

/** The position the diagram on screen belongs to - read from the generated data, never from the file name. */
const positionOnScreen = async page => {
  const image = await page.locator('img.diagram').getAttribute('src');
  const position = cases.positions.find(({ image: known }) => known === image);
  if (!position) throw new Error(`no position for diagram ${image}`);
  return position;
};

const optionFor = (page, trigger) => page.locator(`.option:has(.code:text-is("${trigger}"))`);

/** Taps the trigger the booklet names, without leaving the question. */
const answerCorrectly = async page => {
  const { route } = await positionOnScreen(page);
  await optionFor(page, route[0].trigger).click();
};

const advance = page => page.getByRole('button', { name: /next position|see the result/ }).click();

test('the mode picker offers three modes, starting at Random and Test', async ({ page }) => {
  await open(page);

  await expect(page.getByRole('button', { name: 'Random' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Grouped' })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('button', { name: 'Progressive' })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('button', { name: 'Test' })).toHaveAttribute('aria-pressed', 'true');
  await expect(modeLine(page)).toHaveText('Random · Test · 57 positions');
  // a group is only offered by the mode that needs one
  await expect(page.getByLabel('Group')).toHaveCount(0);
});

test('Grouped lists the 14 groups in booklet order and runs exactly the chosen one', async ({ page }) => {
  await open(page);
  await choose(page, 'Grouped');

  const group = page.getByLabel('Group');
  await expect(group.locator('option')).toHaveText(groups);
  await expect(group).toHaveValue(groups[0]);
  await expect(modeLine(page)).toHaveText(`Grouped · ${groups[0]} · Test · 7 positions`);

  const name = 'T-Shapes';
  await group.selectOption(name);
  await expect(modeLine(page)).toHaveText('Grouped · T-Shapes · Test · 2 positions');

  await start(page);

  await expect(page.locator('.run-status .progress')).toHaveText('1 / 2');
  await expect(page.locator('.run-status .mode-level')).toHaveText('Grouped · Test');
  expect((await positionOnScreen(page)).group).toBe(name);

  await answerCorrectly(page);
  await advance(page);
  await expect(page.locator('.run-status .progress')).toHaveText('2 / 2');
  expect((await positionOnScreen(page)).group).toBe(name);
});

test('Progressive defaults to Training and walks one-step positions first', async ({ page }) => {
  await open(page);
  await choose(page, 'Progressive');

  await expect(page.getByRole('button', { name: 'Training' })).toHaveAttribute('aria-pressed', 'true');
  await expect(modeLine(page)).toHaveText('Progressive · Training · 57 positions');

  await start(page);
  await expect(page.locator('.run-status .mode-level')).toHaveText('Progressive · Training');

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

  await choose(page, 'Training');
  await expect(page.getByRole('button', { name: 'Test' })).toHaveAttribute('aria-pressed', 'false');
  await expect(modeLine(page)).toHaveText('Random · Training · 57 positions');

  await choose(page, 'Grouped');
  await expect(page.getByRole('button', { name: 'Test' })).toHaveAttribute('aria-pressed', 'true');
});

test('Training keeps the case name and OLL number on screen while asking', async ({ page }) => {
  await open(page);
  await choose(page, 'Training');
  await start(page, 'ada');

  const position = await positionOnScreen(page);
  const hint = page.locator('.training-hint');
  await expect(hint).toHaveAttribute('data-oll', String(position.oll));
  await expect(hint).toContainText(position.name);
  await expect(hint).toContainText(`OLL ${position.oll}`);
  // only the name and the number: the group and step count wait for the answer
  await expect(page.getByText(position.group, { exact: true })).toHaveCount(0);

  // the reveal after an answer is the same material as at Test
  await answerCorrectly(page);
  const reveal = page.locator('.reveal');
  await expect(reveal.locator('h3')).toHaveText(position.name);
  await expect(reveal).toContainText(`OLL ${position.oll}`);
  await expect(reveal).toContainText(position.group);
  await expect(reveal.locator('.route li.trigger')).toHaveCount(position.steps);
});

test('Test shows nothing identifying before the answer, and the same reveal after it', async ({ page }) => {
  await open(page);
  await start(page, 'ada');

  const position = await positionOnScreen(page);
  await expect(page.locator('.training-hint')).toHaveCount(0);
  await expect(page.locator('.reveal')).toHaveCount(0);
  await expect(page.getByText(position.name, { exact: true })).toHaveCount(0);
  await expect(page.getByText(`OLL ${position.oll}`)).toHaveCount(0);

  await answerCorrectly(page);
  const reveal = page.locator('.reveal');
  await expect(reveal).toHaveAttribute('data-oll', String(position.oll));
  await expect(reveal.locator('h3')).toHaveText(position.name);
  await expect(reveal).toContainText(`OLL ${position.oll}`);
  await expect(reveal).toContainText(position.group);
  await expect(reveal.locator('.route li.trigger')).toHaveCount(position.steps);
  await expect(reveal.getByRole('link', { name: /cube simulator/i })).toBeVisible();
  // the question itself stays free of everything the reveal carries
  await expect(page.locator('.training-hint')).toHaveCount(0);
});

test('the scores page holds a board per mode and hint level', async ({ page }) => {
  await open(page);
  await page.getByRole('link', { name: 'scores' }).click();

  await expect(page.locator('.mode h3')).toHaveText(['Random', 'Grouped', 'Progressive']);
  for (const mode of ['random', 'grouped', 'progressive']) {
    await expect(page.locator(`.mode[data-mode="${mode}"] .board h4`)).toHaveText(['Training', 'Test']);
  }
  await expect(page.locator('.board')).toHaveCount(6);
  await expect(page.locator('.board .empty').first()).toHaveText('no finished runs yet');
});
