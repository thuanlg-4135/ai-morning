import { test, expect } from "@playwright/test";
import { readdir, readFile } from "node:fs/promises";
import { storiesForEdition } from "../../lib/stories.mjs";
import { basePath } from "../../lib/site.mjs";

const filenames = (await readdir("content"))
  .filter((n) => /^\d{4}-\d{2}-\d{2}\.json$/.test(n))
  .sort()
  .reverse();
const editions = await Promise.all(
  filenames.map(async (name) =>
    JSON.parse(await readFile(`content/${name}`, "utf8")),
  ),
);
const learning = JSON.parse(
  await readFile("content/learning/index.json", "utf8"),
);
const routes = [
  "about/",
  "learn/",
  ...learning.articles.map((a) => `learn/${a.slug}/`),
  "",
  "archive/",
  ...editions.map((e) => `${e.edition_date}/`),
  ...editions.flatMap((e) => storiesForEdition(e).map((s) => s.href.slice(1))),
  "en/",
  "en/archive/",
  ...editions
    .filter((e) => e.translations?.en)
    .map((e) => `en/${e.edition_date}/`),
];

for (const width of [360, 412, 768, 1440, 1920]) {
  test(`all exported pages render without overflow or runtime errors at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width, height: 1000 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (
        response.status() >= 400 &&
        response.url().startsWith("http://localhost")
      )
        errors.push(`${response.status()} ${response.url()}`);
    });
    for (const route of routes) {
      await page.goto(`${basePath}/${route}`);
      await expect(page.locator("h1")).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        route,
      ).toBe(true);
      await expect(page.locator("html")).toHaveAttribute(
        "lang",
        route.startsWith("en/") ? "en" : "vi",
      );
      await page.locator("footer").scrollIntoViewIfNeeded();
      await page.evaluate(async () => {
        const images = [...document.images];
        for (const image of images) image.loading = "eager";
        await Promise.all(
          images.map((image) => image.decode().catch(() => {})),
        );
      });
      expect(
        await page
          .locator("img")
          .evaluateAll((images) =>
            images.every((image) => image.complete && image.naturalWidth > 0),
          ),
        route,
      ).toBe(true);
      if (width === 360 || width === 1440) {
        await page.screenshot({
          path: `.verification/pages/${width}-${route.replaceAll("/", "-") || "home"}.png`,
          fullPage: true,
        });
      }
    }
    expect(errors).toEqual([]);
  });
}

test("theme, font size, reading mode, bookmarks, archive search, checklist and language navigation", async ({
  page,
}) => {
  await page.goto(`${basePath}/`);
  await page
    .getByRole("button", { name: "Giao diện: Tự động", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page
    .getByRole("button", { name: "Giao diện: Sáng", exact: true })
    .click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Tăng cỡ chữ", exact: true }).click();
  await page.getByRole("button", { name: "Chế độ đọc", exact: true }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-large", "true");
  await page.goto(`${basePath}/${editions[0].edition_date}/`);
  await expect(page.locator("main aside")).toBeHidden();
  await page.getByRole("button", { name: "Chế độ đọc", exact: true }).click();
  const bookmark = page.locator(".story-actions button[aria-pressed]").first();
  await bookmark.click();
  await expect(bookmark).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("checkbox").first().check();
  await expect(page.locator(".checklist-count")).toContainText("1/");
  await page.goto(`${basePath}/archive/`);
  await page.getByRole("button", { name: /Bài đã lưu/ }).click();
  await expect(page.locator(".saved-list a")).toHaveCount(1);
  await page.locator(".saved-list a").click();
  await expect(page).toHaveURL(
    new RegExp(`${editions[0].edition_date}/[^/]+/$`),
  );
  await expect(
    page.getByRole("button", { name: /^Bỏ lưu:/ }).first(),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: /^Bỏ lưu:/ })
    .first()
    .click();
  await page.goto(`${basePath}/archive/`);
  await page.getByRole("searchbox").fill(editions[0].edition_date);
  await expect(page.locator(".archive-card")).toHaveCount(1);
  await page.getByRole("searchbox").fill("nothing-matches-this-query");
  await expect(page.locator(".empty-state")).toBeVisible();
  await page.getByRole("button", { name: "Xóa tìm kiếm" }).click();
  await expect(page.locator(".archive-card")).toHaveCount(editions.length);
  await page.getByRole("link", { name: "EN", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("h1")).toHaveText("The newspaper archive");
  await page.locator(".archive-card").first().click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByRole("link", { name: "VI", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "vi");
  await expect(page).toHaveURL(
    new RegExp(
      editions.find((edition) => edition.translations?.en).edition_date + "/$",
    ),
  );
});

test("newspaper discovery and complete articles work without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`http://localhost:8080${basePath}/`);
  const lead = page.locator("main h1 a");
  const title = await lead.textContent();
  await lead.click();
  await expect(page.locator("main h1")).toHaveText(title);
  await expect(page.locator('main a[target="_blank"]').first()).toBeVisible();
  await page
    .getByRole("link", { name: "Trở về bản tin", exact: false })
    .click();
  await expect(page.locator("main h1")).toHaveText(editions[0].headline);
  await page
    .locator("footer")
    .getByRole("link", { name: "Tất cả số báo", exact: true })
    .click();
  await expect(page.locator(".archive-card")).toHaveCount(editions.length);
  await context.close();
});

test("archive searches individual stories without accents and filters by section", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto(`${basePath}/archive/`);
  await page.getByRole("button", { name: /^Từng bài/ }).click();
  await expect(page.locator(".story-result")).toHaveCount(
    editions.reduce(
      (total, edition) =>
        total +
        edition.brief.length +
        edition.trends.length +
        edition.releases.length +
        edition.radar.length,
      0,
    ),
  );
  await page.getByRole("searchbox").fill("  ĐỔI  ");
  const accented = await page.locator(".story-result h2").allTextContents();
  expect(accented.length).toBeGreaterThan(0);
  await page.getByRole("searchbox").fill("doi");
  expect(await page.locator(".story-result h2").allTextContents()).toEqual(
    accented,
  );
  await page.getByRole("searchbox").fill("Copilot");
  await page
    .getByRole("combobox", { name: "Chuyên mục" })
    .selectOption("releases");
  expect(await page.locator(".story-result").count()).toBeGreaterThan(0);
  for (const label of await page
    .locator(".story-result-meta > span")
    .allTextContents())
    expect(label).toBe("Bản phát hành");
  const first = page.locator(".story-result").first();
  const href = await first.getAttribute("href");
  await first.click();
  await expect(page).toHaveURL(new URL(href, "http://localhost:8080").href);
  await expect(page.locator("main h1")).toBeVisible();
  await page.goto(`${basePath}/en/archive/`);
  await page.getByRole("button", { name: /^Stories/ }).click();
  await expect(page.locator(".story-result").first()).toHaveAttribute(
    "href",
    new RegExp(`${basePath}/en/`),
  );
  await page.getByRole("searchbox").fill("nothing-matches-this-query");
  await expect(page.locator(".empty-state")).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();
  expect(await page.locator(".story-result").count()).toBeGreaterThan(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
