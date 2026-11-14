// @ts-check
const { test, expect } = require('@playwright/test');

// the game is played on a phone, in portrait
test.use({ viewport: { width: 390, height: 844 } });

const open = page => page.goto('localhost:3000');

/** The trigger codes of the four options, in the order they are offered. */
const optionOrder = async page => {
  const codes = await page.locator('.option .code').allTextContents();
  return codes.map(code => code.trim());
};

test('has title', async ({ page }) => {
  await open(page);

  await expect(page).toHaveTitle('Rubik triggers');
});

test('shows one position with the four triggers and gives nothing away', async ({ page }) => {
  await open(page);

  const diagram = page.getByRole('img', { name: /position diagram/i });
  await expect(diagram).toBeVisible();
  await expect(diagram).toHaveAttribute('src', /^\/img\/friedrich-oll-\d+\.png$/);

  await expect(page.locator('.option')).toHaveCount(4);
  expect((await optionOrder(page)).sort()).toEqual(['AS', 'ET', 'S', 'WT']);

  // Test-level discipline: the case name, OLL number, group and step count
  // are part of the reveal, not of the question.
  await expect(page.locator('.reveal')).toHaveCount(0);
  await expect(page.locator('.verdict')).toHaveCount(0);
  await expect(page.getByText(/OCLL/)).toHaveCount(0);
  await expect(page.getByText(/^OLL\b/)).toHaveCount(0);
});

test('shows the diagram scaled, never cropped', async ({ page }) => {
  await open(page);

  const diagram = page.locator('img.diagram');
  await expect(diagram).toBeVisible();
  const natural = await diagram.evaluate(image => ({ width: image.naturalWidth, height: image.naturalHeight }));
  const box = await diagram.boundingBox();
  const viewport = page.viewportSize();

  expect(natural.width).toBeGreaterThan(0);
  expect(box.width / box.height).toBeCloseTo(natural.width / natural.height, 1);
  // the whole drawing, top face and side ring, stays on screen
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 0.5);
});

test('offers thumb-sized tap targets', async ({ page }) => {
  await open(page);

  await page.locator('.option').first().click();

  const targets = await page.locator('.option, .reveal .next, .reveal .simulator').evaluateAll(elements =>
    elements.map(element => {
      const { width, height } = element.getBoundingClientRect();
      return { width, height };
    }));
  expect(targets.length).toBeGreaterThanOrEqual(6);
  for (const { width, height } of targets) {
    expect(height).toBeGreaterThanOrEqual(44);
    expect(width).toBeGreaterThanOrEqual(44);
  }
});

test('judges a tap at once and reveals the position, its route and its simulator link', async ({ page }) => {
  await open(page);

  const clicked = (await page.locator('.option').first().locator('.code').innerText()).trim();
  await page.locator('.option').first().click();

  const verdict = page.locator('.verdict');
  await expect(verdict).toBeVisible();
  const judged = await verdict.getAttribute('data-verdict');
  expect(['correct', 'incorrect']).toContain(judged);

  await expect(page.locator('.option:disabled')).toHaveCount(4);

  const reveal = page.locator('.reveal');
  await expect(reveal).toBeVisible();
  await expect(reveal.getByRole('heading')).not.toBeEmpty();
  await expect(reveal).toContainText('OLL');

  // the route is as long as the step count claims
  const steps = Number(await reveal.getAttribute('data-steps'));
  expect(steps).toBeGreaterThanOrEqual(1);
  await expect(page.locator('.route li.trigger')).toHaveCount(steps);
  const chips = (await page.locator('.route li').allTextContents()).map(chip => chip.trim());
  for (const chip of chips) expect(['S', 'AS', 'ET', 'WT', 'U', "U'", 'U2', '→']).toContain(chip);

  // the first step of the route is the answer the verdict judged
  const firstTrigger = (await page.locator('.route li.trigger').first().innerText()).trim();
  if (judged === 'correct') expect(firstTrigger).toBe(clicked);
  else expect(firstTrigger).not.toBe(clicked);

  // the right trigger is always marked, the wrong tap only when it was wrong
  await expect(page.locator('.option.correct')).toHaveCount(1);
  expect((await page.locator('.option.correct .code').innerText()).trim()).toBe(firstTrigger);
  await expect(page.locator('.option.wrong')).toHaveCount(judged === 'incorrect' ? 1 : 0);

  const simulator = reveal.getByRole('link', { name: /cube simulator/i });
  const href = await simulator.getAttribute('href');
  expect(href).toMatch(/^https:\/\/alg\.cubing\.net\//);
  expect(href).toContain('puzzle=3x3x3');
  expect(href).toContain('setup=');
});

test('offers the four triggers in a different order on the next question', async ({ page }) => {
  await open(page);

  const orders = [];
  for (let question = 0; question < 6; question++) {
    orders.push((await optionOrder(page)).join(' '));
    await page.locator('.option').first().click();
    await page.getByRole('button', { name: /(next|try another) position/ }).click();
  }

  expect(new Set(orders).size).toBeGreaterThan(1);
});

test('a new question hides the reveal and the feedback again', async ({ page }) => {
  await open(page);

  await page.locator('.option').first().click();
  await expect(page.locator('.reveal')).toBeVisible();

  await page.getByRole('button', { name: /(next|try another) position/ }).click();

  await expect(page.locator('.reveal')).toHaveCount(0);
  await expect(page.locator('.verdict')).toHaveCount(0);
  await expect(page.locator('.option')).toHaveCount(4);
  await expect(page.locator('.option:enabled')).toHaveCount(4);
});
