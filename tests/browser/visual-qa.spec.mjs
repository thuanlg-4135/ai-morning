import { test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { basePath } from "../../lib/site.mjs";

await mkdir(".verification/pages", { recursive: true });

test("capture tablet visual QA", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1000 });
  await page.goto(`${basePath}/`);
  await page.screenshot({
    path: ".verification/pages/768-home.png",
    fullPage: true,
  });
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
    await page.screenshot({
      path: `.verification/pages/${name}.png`,
      fullPage: true,
    });
  });
}
