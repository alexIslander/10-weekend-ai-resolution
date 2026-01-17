import { expect, test } from "@playwright/test";

test("purchase to reveal flow", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /start the reveal/i }).click();

  await page.getByLabel(/purchaser email/i).fill("alex@example.com");
  await page.getByRole("button", { name: /apply/i }).click();
  await page.getByRole("button", { name: /continue to dashboard/i }).click();

  await expect(page).toHaveURL(/dashboard/);
  await page.getByLabel(/reveal name/i).fill("Sweet Secrets");
  await page.getByRole("button", { name: /save name/i }).click();

  const magicLink = await page.getByTestId("magic-link").textContent();
  expect(magicLink).toBeTruthy();
  const revealId = magicLink?.split("/").pop() ?? "";

  await page.goto(magicLink ?? "");
  await page.getByLabel(/your name/i).fill("Jamie");
  await page.getByRole("button", { name: /next/i }).click();

  for (let i = 0; i < 8; i += 1) {
    await page.getByRole("textbox").fill(`Answer ${i + 1}`);
    if (i < 7) {
      await page.getByRole("button", { name: /next/i }).click();
    }
  }

  await page.getByRole("button", { name: /submit answers/i }).click();
  await expect(page.getByText(/quiz complete/i)).toBeVisible();

  await page.goto(`/reveal/${revealId}`);
  await expect(page.getByText(/sweet secrets/i)).toBeVisible();
  await expect(page.getByText(/answer 1/i)).toBeVisible();
});

test("invalid coupon shows feedback", async ({ page }) => {
  await page.goto("/purchase");
  await page.getByLabel(/purchaser email/i).fill("river@example.com");
  await page.getByLabel(/coupon code/i).fill("NOTREAL");
  await page.getByRole("button", { name: /apply/i }).click();
  await expect(page.getByText(/coupon not recognized/i)).toBeVisible();
});
