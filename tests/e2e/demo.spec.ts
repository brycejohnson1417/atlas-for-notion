import { expect, test } from "@playwright/test";

test("demo mode renders pins and embed validates key", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Demo data · Duplicate the Notion template → Deploy your own")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Atlas" })).toBeVisible();
  await expect(page.getByText("150 of 150 accounts")).toBeVisible();

  await page.goto("/welcome");
  await expect(page.getByRole("heading", { name: "Make it yours in 5 steps" })).toBeVisible();

  await page.goto("/embed?key=dev-demo-key&legend=false");
  await expect(page.getByText("Open full app ↗")).toBeVisible();

  await page.goto("/embed?key=bad");
  await expect(page.getByText("Invalid embed key")).toBeVisible();
});
