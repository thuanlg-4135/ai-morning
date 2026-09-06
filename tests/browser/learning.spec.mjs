import { test, expect } from "@playwright/test";
import { readFile, mkdir } from "node:fs/promises";
import { basePath } from "../../lib/site.mjs";
const { articles } = JSON.parse(
  await readFile("content/learning/index.json", "utf8"),
);

for (const theme of ["light", "dark"]) {
  test(`learning pages visual review: ${theme}`, async ({ page }) => {
    test.setTimeout(120_000);
    await mkdir(".verification/pages", { recursive: true });
    await page.addInitScript(
      (value) => localStorage.setItem("ai-morning-theme", value),
      theme,
    );
    for (const width of [360, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const slug of ["", ...articles.map((a) => a.slug)]) {
        await page.goto(`${basePath}/learn/${slug ? `${slug}/` : ""}`);
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator("h1")).toBeVisible();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await page.screenshot({
          path: `.verification/pages/learning-${width}-${theme}-${slug || "index"}.png`,
          fullPage: true,
        });
      }
    }
  });
}

test("learning is reachable from the newspaper without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 360, height: 900 },
  });
  const page = await context.newPage();
  await page.goto(`${basePath}/`);
  await page.getByRole("link", { name: "Học & làm", exact: true }).click();
  await expect(page.locator("h1")).toContainText("Đọc để hiểu");
  await page
    .getByRole("link", { name: articles[2].title, exact: true })
    .click();
  await expect(page.locator("h1")).toHaveText(articles[2].title);
  await page
    .getByRole("link", { name: articles[2].steps[1].title, exact: true })
    .click();
  await expect(page).toHaveURL(/#step-2$/);
  await expect(page.locator("#step-2")).toBeInViewport();
  await expect(page.locator(".learn-sources a")).toHaveCount(
    articles[2].sources.length,
  );
  await context.close();
});
