import { test, expect } from "@playwright/test";
import { basePath } from "../../lib/site.mjs";

async function computed(page, selector, property) {
  return page.locator(selector).first().evaluate(
    (element, name) => getComputedStyle(element)[name],
    property,
  );
}

test("single quick-news story uses a split layout on wide desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${basePath}/`);

  const card = page.locator(".brief-grid > .brief-card");
  await expect(card).toHaveCount(1);
  expect(await computed(page, ".brief-card", "display")).toBe("grid");

  const columns = await computed(page, ".brief-card", "gridTemplateColumns");
  expect(columns.trim().split(/\s+/)).toHaveLength(2);
  expect(await computed(page, ".brief-card > .editorial-visual", "gridArea")).toBe("visual");
});

test("single quick-news story keeps the stacked card below the desktop breakpoint", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 1000 });
  await page.goto(`${basePath}/`);

  const card = page.locator(".brief-grid > .brief-card");
  await expect(card).toHaveCount(1);
  expect(await computed(page, ".brief-card", "display")).toBe("block");
});
