import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { basePath } from "../../lib/site.mjs";

await mkdir(".verification/pages", { recursive: true });

async function settleVisuals(page) {
  await page.locator(".footer").scrollIntoViewIfNeeded();
  await page.evaluate(async () => {
    const images = [...document.images];
    for (const image of images) image.loading = "eager";
    await Promise.all(images.map((image) => image.decode().catch(() => {})));
    window.scrollTo(0, 0);
  });
  await expect
    .poll(async () =>
      page
        .locator("img")
        .evaluateAll((images) =>
          images.every((image) => image.complete && image.naturalWidth > 0),
        ),
    )
    .toBe(true);
}

async function capture(page, path) {
  await page.evaluate(() => document.fonts.ready);
  await settleVisuals(page);
  await page.screenshot({ path, fullPage: true });
}

test("capture tablet visual QA", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1000 });
  await page.goto(`${basePath}/`);
  await capture(page, ".verification/pages/768-home.png");
});

for (const [width, height, name] of [
  [360, 900, "360-home-dark"],
  [1440, 1000, "1440-home-dark"],
]) {
  test(`capture dark-mode visual QA at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.addInitScript(() => {
      localStorage.setItem("ai-morning-theme", "dark");
    });
    await page.goto(`${basePath}/`);
    await capture(page, `.verification/pages/${name}.png`);
  });
}
