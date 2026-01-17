import { expect, test, type APIRequestContext } from "@playwright/test";

const adminToken = "test-token";

const uniqueEmail = (prefix: string) =>
  `${prefix}+${Math.random().toString(36).slice(2, 10)}@example.com`;

const setFeatureFlag = async (
  request: APIRequestContext,
  key: string,
  enabled: boolean
) => {
  await request.post("/api/admin/feature-flags", {
    headers: { "x-admin-token": adminToken },
    data: { key, enabled, config: {} }
  });
};

const setQuestionSetFlow = async (
  request: APIRequestContext,
  enabled: boolean
) => setFeatureFlag(request, "question_set_flow", enabled);

const setEmailSend = async (
  request: APIRequestContext,
  enabled: boolean
) => setFeatureFlag(request, "email_send", enabled);

test("purchase to reveal flow", async ({ page, request }) => {
  await setQuestionSetFlow(request, false);
  await setEmailSend(request, false);
  const purchaserEmail = uniqueEmail("alex");
  await page.goto("/");
  await page.getByRole("link", { name: /start the reveal/i }).click();

  await page.getByRole("button", { name: /current connection/i }).click();
  await page.getByRole("button", { name: /continue/i }).click();

  await page.getByLabel(/purchaser email/i).fill(purchaserEmail);
  await page.getByRole("button", { name: /apply/i }).click();
  await page.getByRole("button", { name: /continue to dashboard/i }).click();

  await expect(page).toHaveURL(/dashboard/);
  await page.getByLabel(/reveal name/i).fill("Sweet Secrets");
  await page.getByRole("button", { name: /save name/i }).click();

  const magicLink = await page.getByTestId("magic-link").textContent();
  expect(magicLink).toBeTruthy();
  const revealId = magicLink?.split("/").pop() ?? "";

  await page.goto(magicLink ?? "");
  await page.getByRole("button", { name: /begin/i }).click();
  await page.getByLabel(/your name/i).fill("Jamie");
  await page.getByRole("button", { name: /next/i }).click();

  for (let i = 0; i < 8; i += 1) {
    await page.getByRole("textbox").fill(`Answer ${i + 1}`);
    if (i < 7) {
      await page.getByRole("button", { name: /next/i }).click();
    }
  }

  await page.getByRole("button", { name: /submit answers/i }).click();
  await expect(page.getByText(/submission received/i)).toBeVisible();

  await page.goto(`/reveal/${revealId}`);
  await expect(page.getByText(/sweet secrets/i)).toBeVisible();
  await expect(page.getByText(/answer 1/i)).toBeVisible();
});

test("invalid coupon shows feedback", async ({ page, request }) => {
  await setQuestionSetFlow(request, false);
  await setEmailSend(request, false);
  await page.goto("/question-sets");
  await page.getByRole("button", { name: /current connection/i }).click();
  await page.getByRole("button", { name: /continue/i }).click();

  await page.getByLabel(/purchaser email/i).fill("river@example.com");
  await page.getByLabel(/coupon code/i).fill("NOTREAL");
  await page.getByRole("button", { name: /apply/i }).click();
  await expect(page.getByText(/coupon not recognized/i)).toBeVisible();
});

test("option b selection after purchase", async ({ page, request }) => {
  await setQuestionSetFlow(request, true);
  await setEmailSend(request, false);
  const purchaserEmail = uniqueEmail("optionb");

  await page.goto("/purchase");
  await page.getByLabel(/purchaser email/i).fill(purchaserEmail);
  await page.getByRole("button", { name: /apply/i }).click();
  await page.getByRole("button", { name: /continue to dashboard/i }).click();

  await expect(page).toHaveURL(/dashboard/);
  await page.getByRole("link", { name: /select question set/i }).click();
  await page.getByRole("button", { name: /clear communication/i }).click();
  await page.getByRole("button", { name: /continue/i }).click();

  await expect(page.getByTestId("magic-link")).toBeVisible();

  await setQuestionSetFlow(request, false);
});

test("lights off uses single select defaults", async ({ page, request }) => {
  await setQuestionSetFlow(request, false);
  await setEmailSend(request, false);
  const purchaserEmail = uniqueEmail("lights");
  await page.goto("/question-sets");
  await page.getByRole("button", { name: /lights off/i }).click();
  await page.getByRole("button", { name: /continue/i }).click();

  await page.getByLabel(/purchaser email/i).fill(purchaserEmail);
  await page.getByRole("button", { name: /continue to dashboard/i }).click();

  const magicLink = await page.getByTestId("magic-link").textContent();
  await page.goto(magicLink ?? "");
  await page.getByRole("button", { name: /begin/i }).click();
  await page.getByLabel(/your name/i).fill("Jamie");
  await page.getByRole("button", { name: /next/i }).click();

  const firstRadio = page.getByRole("radio").first();
  await expect(firstRadio).toBeChecked();
});

test("quiz lock blocks a second tab", async ({ page, context, request }) => {
  await setQuestionSetFlow(request, false);
  await setEmailSend(request, false);
  const purchaserEmail = uniqueEmail("lock");
  await page.goto("/question-sets");
  await page.getByRole("button", { name: /current connection/i }).click();
  await page.getByRole("button", { name: /continue/i }).click();

  await page.getByLabel(/purchaser email/i).fill(purchaserEmail);
  await page.getByRole("button", { name: /continue to dashboard/i }).click();

  const magicLink = await page.getByTestId("magic-link").textContent();
  await page.goto(magicLink ?? "");
  await page.getByRole("button", { name: /begin/i }).click();

  const secondPage = await context.newPage();
  await secondPage.goto(magicLink ?? "");
  await expect(secondPage.getByText(/quiz already started/i)).toBeVisible();
});

test("share button copies the magic link", async ({ page, request }) => {
  await setQuestionSetFlow(request, false);
  await setEmailSend(request, false);
  const purchaserEmail = uniqueEmail("share");
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.resolve() },
      configurable: true
    });
  });

  await page.goto("/question-sets");
  await page.getByRole("button", { name: /current connection/i }).click();
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByLabel(/purchaser email/i).fill(purchaserEmail);
  await page.getByRole("button", { name: /continue to dashboard/i }).click();

  await expect(page.getByTestId("magic-link")).toBeVisible();
  await page.getByRole("button", { name: /share/i }).click();
  await expect(page.getByText(/link copied/i)).toBeVisible();
});

test("email send panel appears and shows message", async ({ page, request }) => {
  await setQuestionSetFlow(request, false);
  await setEmailSend(request, true);
  const purchaserEmail = uniqueEmail("emailpanel");

  await page.goto("/question-sets");
  await page.getByRole("button", { name: /current connection/i }).click();
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByLabel(/purchaser email/i).fill(purchaserEmail);
  await page.getByRole("button", { name: /continue to dashboard/i }).click();

  await page.getByLabel(/recipient email/i).fill("partner@example.com");
  await page.getByRole("button", { name: /send link/i }).click();
  await expect(page.getByText(/email sending is not configured yet/i)).toBeVisible();
});

test("admin sees completed reveals and feedback", async ({ page, request }) => {
  await setQuestionSetFlow(request, false);
  await setEmailSend(request, false);
  const purchaserEmail = uniqueEmail("completed");
  await page.addInitScript(() => {
    localStorage.setItem("dualreveal_admin_token", "test-token");
  });

  await page.goto("/question-sets");
  await page.getByRole("button", { name: /current connection/i }).click();
  await page.getByRole("button", { name: /continue/i }).click();

  await page.getByLabel(/purchaser email/i).fill(purchaserEmail);
  await page.getByRole("button", { name: /continue to dashboard/i }).click();

  const magicLink = await page.getByTestId("magic-link").textContent();
  await page.goto(magicLink ?? "");
  await page.getByRole("button", { name: /begin/i }).click();
  await page.getByLabel(/your name/i).fill("Jamie");
  await page.getByRole("button", { name: /next/i }).click();

  for (let i = 0; i < 8; i += 1) {
    await page.getByRole("textbox").fill(`Answer ${i + 1}`);
    if (i < 7) {
      await page.getByRole("button", { name: /next/i }).click();
    }
  }

  await page.getByRole("button", { name: /submit answers/i }).click();
  await expect(page.getByText(/submission received/i)).toBeVisible();

  await page.getByRole("button", { name: /thumbs up/i }).click();
  await page.getByLabel(/optional note/i).fill("Clean and thoughtful.");
  await page.getByRole("button", { name: /submit/i }).click();
  await expect(page.getByRole("heading", { name: /how did this feel/i }))
    .toHaveCount(0);

  await page.goto("/admin");
  const completedSection = page.locator("section#completed");
  await expect(completedSection.getByText(purchaserEmail)).toBeVisible();
  const feedbackSection = page.locator("section#feedback");
  await expect(feedbackSection.getByText(/clean and thoughtful/i)).toBeVisible();
});
