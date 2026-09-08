import { test, expect } from "@playwright/test";
import { basePath } from "../../lib/site.mjs";

async function computed(page, selector, property) {
  return page.locator(selector).first().evaluate(
    (element, name) => getComputedStyle(element)[name],
    property,
  );
}

test("portrait tablet uses a single-column editorial flow", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1000 });
  await page.goto(`${basePath}/`);

  const heroColumns = await computed(page, ".edition-hero", "gridTemplateColumns");
  expect(heroColumns.trim().split(/\s+/)).toHaveLength(1);
  expect(await computed(page, ".reading-layout", "display")).toBe("block");
  await expect(page.locator(".edition-aside")).toBeHidden();
});

test("desktop keeps the established two-column identity", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 1000 });
  await page.goto(`${basePath}/`);

  const heroColumns = await computed(page, ".edition-hero", "gridTemplateColumns");
  expect(heroColumns.trim().split(/\s+/)).toHaveLength(2);
  expect(await computed(page, ".reading-layout", "display")).toBe("grid");
  await expect(page.locator(".edition-aside")).toBeVisible();
});

test("informative microcopy never drops below the refinement floor", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 900 });
  // This edition includes captions and credits; daily visuals are optional.
  await page.goto(`${basePath}/2026-09-06/`);

  const checks = [
    [".freshness", 10],
    [".source-label", 10],
    [".source-type", 10],
    [".section-number", 10],
    [".release-status", 10],
    [".verdict-label", 10],
    [".editorial-visual figcaption", 11],
    [".editorial-visual figcaption > span", 10],
  ];

  for (const [selector, minimum] of checks) {
    await expect(page.locator(selector).first()).toBeAttached();
    const size = Number.parseFloat(await computed(page, selector, "fontSize"));
    expect(size, selector).toBeGreaterThanOrEqual(minimum);
  }
});
