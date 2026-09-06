import { test, expect } from "@playwright/test";
import { basePath } from "../../lib/site.mjs";

async function style(page, selector, property) {
  return page.locator(selector).first().evaluate(
    (element, name) => getComputedStyle(element)[name],
    property,
  );
}

test("Quick Edition stays compact when opened", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 1000 });
  await page.goto(`${basePath}/`);
  await page.locator(".quick-edition > summary").click();
  expect(await style(page, ".quick-edition li p", "webkitLineClamp")).toBe("3");
  await expect(page.locator(".quick-full-link").first()).toBeVisible();

  await page.setViewportSize({ width: 360, height: 900 });
  expect(await style(page, ".quick-edition li p", "webkitLineClamp")).toBe("2");
});

test("quick news and releases keep distinct card signals", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 1000 });
  await page.goto(`${basePath}/`);

  expect(await style(page, ".brief-card", "borderTopWidth")).toBe("3px");
  expect(await style(page, ".release-card", "borderTopWidth")).toBe("3px");
  expect(await style(page, ".brief-card", "borderTopColor")).not.toBe(
    await style(page, ".release-card", "borderTopColor"),
  );
});

test("archive informative metadata stays at least 10px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto(`${basePath}/archive/`);

  for (const selector of [
    ".filter-tabs button span",
    ".archive-card-top .eyebrow",
    ".archive-count > .eyebrow",
    ".card-bottom",
  ]) {
    await expect(page.locator(selector).first()).toBeAttached();
    const size = Number.parseFloat(await style(page, selector, "fontSize"));
    expect(size, selector).toBeGreaterThanOrEqual(10);
  }
});
