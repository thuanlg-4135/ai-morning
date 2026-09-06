import { test, expect } from "@playwright/test";
import { basePath } from "../../lib/site.mjs";

test("large desktop centers the complete long-form composition", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${basePath}/`);

  const box = await page.locator(".reading-layout").boundingBox();
  expect(box).not.toBeNull();
  expect(box.width).toBeLessThanOrEqual(1181);
  expect(Math.abs(box.x - (1440 - box.width) / 2)).toBeLessThanOrEqual(2);
});

test("story discovery remains accessible on tablet and mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 1000 });
  await page.goto(`${basePath}/`);
  await expect(page.locator(".spotlight-grid")).toBeVisible();
  await expect(page.locator(".edition-strip")).toBeVisible();

  await page.setViewportSize({ width: 360, height: 900 });
  const story = page.locator(".spotlight-link").first();
  await expect(story).toBeVisible();
  const target = await story.getAttribute("href");
  await story.click();
  await expect(page).toHaveURL(new RegExp(`${target}$`));
  await expect(page.locator(target)).toBeInViewport();

  await page.setViewportSize({ width: 1024, height: 1000 });
  await page.reload();
  await expect(page.locator(".spotlight-grid")).toBeVisible();
  await expect(page.locator(".edition-strip")).toBeVisible();
});
