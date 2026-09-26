import { test, expect } from "@playwright/test";
import { readdir, readFile } from "node:fs/promises";
import { basePath } from "../../lib/site.mjs";

const latestName = (await readdir("content"))
  .filter((n) => /^\d{4}-\d{2}-\d{2}\.json$/.test(n))
  .sort()
  .at(-1);
const latest = JSON.parse(await readFile(`content/${latestName}`, "utf8"));

for (const theme of ["light", "dark"]) {
  for (const width of [360, 768, 1440]) {
    test(`newspaper composition and article reading at ${width}px in ${theme}`, async ({
      page,
    }) => {
      await page.addInitScript(
        (value) => localStorage.setItem("ai-morning-theme", value),
        theme,
      );
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`${basePath}/`);
      await page.evaluate(() => document.fonts.ready);
      const ids = await page
        .locator("main [data-story-id]")
        .evaluateAll((elements) => elements.map((e) => e.dataset.storyId));
      expect(ids.length).toBeGreaterThanOrEqual(12);
      expect(new Set(ids).size).toBe(ids.length);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const palette = await page.locator("body").evaluate((e) => {
        const css = getComputedStyle(e);
        return {
          text: css.color,
          paper: css.backgroundColor,
          accent: css.getPropertyValue("--accent").trim(),
        };
      });
      expect(palette.accent).toBe(theme === "light" ? "#0169cc" : "#66b5ff");
      const luminance = (color) => {
        const channels = color
          .match(/\d+/g)
          .slice(0, 3)
          .map(Number)
          .map((v) => v / 255)
          .map((v) =>
            v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
          );
        return (
          channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
        );
      };
      const levels = [luminance(palette.text), luminance(palette.paper)].sort(
        (a, b) => b - a,
      );
      expect((levels[0] + 0.05) / (levels[1] + 0.05)).toBeGreaterThanOrEqual(
        4.5,
      );
      await expect(page.locator("main img").first()).toHaveCSS(
        "filter",
        "none",
      );
      const lead = page.locator("main h1 a");
      const href = await lead.getAttribute("href");
      if (width === 1440) {
        const boxes = await page
          .locator("main [data-story-id]")
          .evaluateAll((elements) =>
            elements.slice(0, 3).map((e) => ({
              x: e.getBoundingClientRect().x,
              w: e.getBoundingClientRect().width,
            })),
          );
        expect(boxes[0].w).toBeGreaterThan(boxes[1].w);
        expect(boxes[1].x).toBeGreaterThan(boxes[0].x);
      }
      await loadImages(page);
      await page.screenshot({
        path: `.verification/redesign/home-${width}-${theme}.png`,
        fullPage: true,
      });
      await page.goto(href);
      await expect(page.locator("main h1")).toBeVisible();
      await expect(page.locator("main article p").first()).toBeVisible();
      expect(
        await page.locator('main article a[target="_blank"]').count(),
      ).toBeGreaterThan(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await loadImages(page);
      await page.screenshot({
        path: `.verification/redesign/article-${width}-${theme}.png`,
        fullPage: true,
      });
    });
  }
}
async function loadImages(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (const image of document.images) image.loading = "eager";
    await Promise.all(
      [...document.images].map((image) => image.decode().catch(() => {})),
    );
  });
}

test("article preferences, copying and saved URLs survive navigation", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(`${basePath}/`);
  await page.locator("main h1 a").click();
  await expect(page).toHaveURL(new RegExp(`${latest.edition_date}/[^/]+/$`));
  const url = page.url();
  const paragraph = page.locator('main article [class*="prose"] > p').first();
  const initial = await paragraph.evaluate((e) =>
    parseFloat(getComputedStyle(e).fontSize),
  );
  await page
    .getByRole("button", { name: "Tăng cỡ chữ", exact: true })
    .first()
    .click();
  expect(
    await paragraph.evaluate((e) => parseFloat(getComputedStyle(e).fontSize)),
  ).toBeGreaterThan(initial);
  await page.getByRole("button", { name: /^Sao chép liên kết:/ }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(url);
  await page.getByRole("button", { name: /^Lưu bài:/ }).click();
  await page.goto(`${basePath}/archive/`);
  await page.getByRole("button", { name: /Bài đã lưu/ }).click();
  await page.locator(".saved-list a").click();
  await expect(page).toHaveURL(url);
  await expect(page.getByRole("button", { name: /^Bỏ lưu:/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("old edition fragments remain available", async ({ page }) => {
  for (const section of ["brief", "trends", "releases", "radar"])
    for (const item of latest[section]) {
      const anchor = item.id || item.event_id;
      await page.goto(`${basePath}/${latest.edition_date}/#${anchor}`);
      await expect(page.locator(`[id="${anchor}"]`)).toBeInViewport();
    }
});
