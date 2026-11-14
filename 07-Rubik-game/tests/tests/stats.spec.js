// @ts-check
const { test, expect } = require('@playwright/test');

// the positions the app ships, so a seeded record can name a real position
const cases = require('../../app/src/quiz/entity/cases.json');

// the game is played on a phone, in portrait
test.use({ viewport: { width: 390, height: 844 } });

// the template's single persistence key (app/src/app.config.js + StorageControl.js)
const KEY = 'rubik-game.localstorage.control';

const DAY = new Date(2026, 10, 14, 10, 0, 0).getTime();

const run = ({ score, correct, total = 57, mode = 'random', hintLevel = 'test', startedAt = DAY, finishedAt = DAY + 30_000 }) => ({
  mode,
  hintLevel,
  score,
  correct,
  total,
  startedAt,
  finishedAt
});

/** A per-position record after `attempts` answers, `correct` of them right. */
const record = (attempts, correct, lastSeenAt = DAY) => ({
  attempts,
  correct,
  wrong: attempts - correct,
  lastSeenAt,
  streak: 0
});

/**
 * Puts the players in localStorage, the way the template persists them, then
 * loads the play screen and types the name the stats page will report on — the
 * same two taps a player makes. Nothing is seeded on a later reload.
 */
const openPlay = async (page, players, name = 'ada') => {
  await page.goto('localhost:3000');
  await page.evaluate(([key, value]) => localStorage.setItem(key, JSON.stringify({ players: value })), [KEY, players]);
  await page.reload();
  if (name) await page.getByLabel('Name').fill(name);
};

/** The play screen, one tap later: the stats page. */
const openStats = async (page, players, name = 'ada') => {
  await openPlay(page, players, name);
  await page.getByRole('link', { name: 'stats' }).click();
  await expect(page.locator('.stats')).toBeVisible();
};

const storedPlayers = page => page.evaluate(key => (JSON.parse(localStorage.getItem(key) || 'null') || {}).players, KEY);

const modeRow = (page, mode) => page.locator(`tr[data-mode="${mode}"]`);
const groupRow = (page, group) => page.locator(`tr[data-group="${group}"]`);
const weakRows = page => page.locator('.weak-row');

const position = oll => {
  const found = cases.positions.find(candidate => candidate.oll === oll);
  if (!found) throw new Error(`no position ${oll}`);
  return found;
};

const optionFor = (page, trigger) => page.locator(`.option:has(.code:text-is("${trigger}"))`);

/** Two positions of the first group, answered four times and twice. */
const records = () => {
  const [first, second] = cases.positions;
  return { [first.oll]: record(4, 1), [second.oll]: record(2, 2) };
};

const adaWithARun = () => ({
  ada: { name: 'ada', positions: records(), runs: [run({ score: 120, correct: 40 })] }
});

test('the stats page is one tap from play and totals up the history', async ({ page }) => {
  await openPlay(page, adaWithARun());

  await page.getByRole('link', { name: 'stats' }).click();

  await expect(page.locator('.stats')).toBeVisible();
  await expect(page.locator('.stats-player')).toHaveText('ada');
  // four answers on the first position and two on the second: six answers, three right
  await expect(page.locator('.total-runs')).toHaveText('1');
  await expect(page.locator('.total-answered')).toHaveText('6');
  await expect(page.locator('.total-accuracy')).toHaveText('50%');
});

test('a mode row reports its own finished runs, accuracy and best score', async ({ page }) => {
  await openStats(page, {
    ada: { name: 'ada', positions: {}, runs: [
      run({ score: 120, correct: 40 }),
      run({ score: 250, correct: 30, hintLevel: 'training' }),
      run({ score: 30, correct: 3, total: 4, mode: 'grouped', hintLevel: 'training' }),
      // a run that never finished counts for nothing, however good it looks
      run({ score: 9999, correct: 57, finishedAt: null })
    ] }
  });

  // 40 + 30 right out of 57 + 57 asked: 61%, and the better of the two scores
  await expect(modeRow(page, 'random').locator('td')).toHaveText(['2', '61%', '250']);
  await expect(modeRow(page, 'grouped').locator('td')).toHaveText(['1', '75%', '30']);
  await expect(modeRow(page, 'progressive').locator('td')).toHaveText(['0', '0%', '0']);
  await expect(page.locator('tr[data-mode]')).toHaveCount(3);
});

test('the group table covers all 14 groups in booklet order, and a group rolls up its positions', async ({ page }) => {
  await openStats(page, adaWithARun());

  await expect(page.locator('tr[data-group]')).toHaveCount(14);
  await expect(page.locator('tr[data-group] th')).toHaveText(cases.groups);

  const group = cases.positions[0].group;
  await expect(groupRow(page, group).locator('td')).toHaveText(['6', '50%']);
  await expect(groupRow(page, cases.groups[1]).locator('td')).toHaveText(['0', '0%'], 'a group never played reads zero');
});

test('weak spots list the worst positions with attempts, accuracy and when they were last seen', async ({ page }) => {
  await openStats(page, adaWithARun());

  const rows = weakRows(page);
  await expect(rows).toHaveCount(2);

  const worst = rows.first();
  await expect(worst).toHaveAttribute('data-oll', '26');
  await expect(worst).toContainText('OCLL6 (Anti-Sune)');
  await expect(worst).toContainText('OLL 26');
  await expect(worst).toContainText(cases.positions[0].group);
  await expect(worst).toContainText('25%');
  await expect(worst).toContainText('4 attempts');
  await expect(worst).toContainText('last seen 2026-11-14');

  // the better position ranks below, and the date is shown as a date
  await expect(rows.nth(1)).toContainText('100%');
  await expect(rows.nth(1)).toContainText('2 attempts');
});

test('weak spots stop at ten rows, however many positions have been answered', async ({ page }) => {
  const positions = {};
  cases.positions.slice(0, 14).forEach((candidate, index) => {
    positions[candidate.oll] = record(4, index % 4, DAY + index);
  });
  await openStats(page, { ada: { name: 'ada', positions, runs: [run({ score: 120, correct: 40 })] } });

  await expect(weakRows(page)).toHaveCount(10);
  // four positions at 0%, four at 25%, and the first two at 50% fill the ten rows
  await expect(weakRows(page).first()).toHaveAttribute('data-accuracy', '0');
  await expect(weakRows(page).nth(3)).toHaveAttribute('data-accuracy', '0');
  await expect(weakRows(page).nth(4)).toHaveAttribute('data-accuracy', '25');
  await expect(weakRows(page).nth(9)).toHaveAttribute('data-accuracy', '50');
});

test('a weak spot starts a one-question drill on that position, whose score lands on no board', async ({ page }) => {
  await openStats(page, { ada: { name: 'ada', positions: records(), runs: [] } });

  const target = position(26);
  await weakRows(page).first().getByRole('link').click();

  await expect(page).toHaveURL(/localhost:3000\/$/);
  await expect(page.locator('.run-status .progress')).toHaveText('1 / 1');
  await expect(page.locator('.run-status .mode-level')).toHaveText('Drill · Test');
  await expect(page.locator('img.diagram')).toHaveAttribute('src', target.image);

  // answer it wrong: a drill is still a question with a right answer to show
  const wrong = ['S', 'AS', 'ET', 'WT'].find(trigger => trigger !== target.route[0].trigger);
  await optionFor(page, wrong).click();
  await expect(page.locator('.verdict')).toHaveAttribute('data-verdict', 'incorrect');
  await expect(page.locator('.verdict')).toContainText(target.route[0].trigger);

  await page.getByRole('button', { name: 'see the result' }).click();

  const finish = page.locator('.finish');
  await expect(finish).toBeVisible();
  await expect(finish).toHaveAttribute('data-total', '1');
  await expect(finish).toHaveAttribute('data-correct', '0');
  // practice, not a score: there is no board for it to link to
  await expect(finish.locator('.board-link')).toHaveCount(0);

  // the answer went into the record the stats page reads...
  await page.getByRole('link', { name: 'stats' }).click();
  await expect(page.locator('.weak-row[data-oll="26"]')).toContainText('5 attempts');
  await expect(page.locator('.weak-row[data-oll="26"]')).toContainText('20%');
  // ...and the drill's score is on no board at all
  await page.getByRole('link', { name: 'scores' }).click();
  await expect(page.locator('.board-row')).toHaveCount(0);
});

test('the play screen after a drill comes back with the name, on a mode the picker offers', async ({ page }) => {
  await openStats(page, { ada: { name: 'ada', positions: records(), runs: [] } });

  await weakRows(page).first().getByRole('link').click();
  await optionFor(page, position(26).route[0].trigger).click();
  await page.getByRole('button', { name: 'see the result' }).click();
  await page.getByRole('button', { name: 'start another run' }).click();

  await expect(page.getByLabel('Name')).toHaveValue('ada');
  await expect(page.getByRole('button', { name: 'Random' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.mode-line')).toHaveText('Random · Test · 57 positions');
});

test('a player with answers but no finished run still sees the practice, and is told nothing finished', async ({ page }) => {
  await openStats(page, { ada: { name: 'ada', positions: records(), runs: [] } });

  // the ticket's empty state for "no runs" is this line, without hiding the answers
  await expect(page.locator('.stats .empty')).toContainText('no finished runs yet');
  await expect(page.locator('.total-runs')).toHaveText('0');
  await expect(weakRows(page)).toHaveCount(2);
});

test('a player with no history at all gets an empty page, not a table of zeros', async ({ page }) => {
  await openStats(page, { ada: { name: 'ada', positions: {}, runs: [] } });

  await expect(page.locator('.stats .empty')).toContainText('no answers yet');
  await expect(page.locator('.stat-table')).toHaveCount(0);
  await expect(weakRows(page)).toHaveCount(0);
  // nothing to clear yet, but the name can still be deleted
  await expect(page.getByRole('button', { name: 'delete player' })).toBeVisible();
});

test('with no name at all the stats page points at the play screen', async ({ page }) => {
  await openStats(page, {}, '');

  await expect(page.locator('.stats .empty')).toContainText('no player yet');
  await expect(page.getByRole('button', { name: 'delete player' })).toHaveCount(0);
});

test('reset stats clears the records and runs, keeps the name, and leaves other players alone', async ({ page }) => {
  await openStats(page, {
    ada: { name: 'ada', positions: records(), runs: [run({ score: 120, correct: 40 })] },
    bob: { name: 'bob', positions: {}, runs: [run({ score: 60, correct: 20 })] }
  });

  await page.getByRole('button', { name: 'reset stats' }).click();

  await expect(page.locator('.stats .empty')).toContainText('no answers yet');
  await expect(weakRows(page)).toHaveCount(0);
  await expect(page.locator('.stats')).toHaveAttribute('data-name', 'ada');

  // the runs are gone from the boards, and another player is untouched
  await page.getByRole('link', { name: 'scores' }).click();
  await expect(page.locator('#board-random-test .board-row .name')).toHaveText(['bob']);

  // the name is kept: the next run is still recorded under it
  await page.getByRole('link', { name: 'play' }).click();
  await expect(page.getByLabel('Name')).toHaveValue('ada');
  expect(Object.keys(await storedPlayers(page)).sort()).toEqual(['ada', 'bob']);
});

test('delete player removes the name, its records and its rows from the boards', async ({ page }) => {
  await openStats(page, {
    ada: { name: 'ada', positions: records(), runs: [
      run({ score: 120, correct: 40 }),
      run({ score: 90, correct: 30, hintLevel: 'training' })
    ] },
    bob: { name: 'bob', positions: {}, runs: [run({ score: 60, correct: 20 })] }
  });

  await page.getByRole('button', { name: 'delete player' }).click();

  await expect(page.locator('.stats .empty')).toContainText('no player yet');

  // ada's rows leave both boards she was on, bob's row stays
  await page.getByRole('link', { name: 'scores' }).click();
  await expect(page.locator('#board-random-test .board-row .name')).toHaveText(['bob']);
  await expect(page.locator('#board-random-training .board-row')).toHaveCount(0);

  // the device forgets the name too: play reopens with an empty field
  await page.getByRole('link', { name: 'play' }).click();
  await expect(page.getByLabel('Name')).toHaveValue('');
  expect(Object.keys(await storedPlayers(page))).toEqual(['bob']);
});
