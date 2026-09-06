import { test, expect } from "@playwright/test";
import { basePath } from "../../lib/site.mjs";

async function computed(page, selector, property) {
  return page.locator(selector).first().evaluate(
    (element, name) => getComputedStyle(element)[name],
    property,
  );
}

test("dark mode uses calm surfaces and keeps the edition strip dark", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => {
    window.localStorage.setItem("ai-morning-theme", "dark");
  });
  await page.goto(`${basePath}/`);

  expect(await computed(page, "body", "backgroundColor")).toBe("rgb(25, 29, 27)");
  expect(await computed(page, ".quick-edition", "backgroundColor")).toBe("rgb(34, 39, 37)");
  expect(await computed(page, ".edition-strip", "backgroundColor")).toBe("rgb(34, 39, 37)");
  expect(await computed(page, ".edition-strip", "color")).toBe("rgb(243, 240, 231)");
});

test("phone section headings keep the title and remove only the secondary note", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto(`${basePath}/`);

  await expect(page.locator(".section-heading h2").first()).toBeVisible();
  await expect(page.locator(".section-note").first()).toBeHidden();
});
