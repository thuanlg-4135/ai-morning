import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { basePath } from "../lib/site.mjs";
import { translatedEdition } from "../lib/localize.mjs";

const escape = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#x27;");
const names = (await readdir("content"))
  .filter((n) => /^\d{4}-\d{2}-\d{2}\.json$/.test(n))
  .sort();
const editions = await Promise.all(
  names.map(async (name) =>
    JSON.parse(await readFile(`content/${name}`, "utf8")),
  ),
);

test("every edition exports its complete content and evidence in the correct language", async () => {
  for (const original of editions) {
    for (const language of ["vi", "en"]) {
      const edition = translatedEdition(original, language);
      if (!edition) continue;
      const prefix = language === "en" ? "en/" : "";
      const html = await readFile(
        `dist/${prefix}${edition.edition_date}/index.html`,
        "utf8",
      );
      assert.ok(
        html.includes(`<html lang="${language}"`),
        `${prefix}${edition.edition_date}: HTML language`,
      );
      assert.ok(
        html.includes(escape(edition.headline)),
        `${edition.edition_date}: headline`,
      );
      for (const item of [
        ...edition.brief,
        ...edition.trends,
        ...edition.releases,
        ...edition.radar,
      ]) {
        for (const text of [
          item.title,
          item.text,
          item.feature,
          item.summary,
          item.action,
          item.verdict_note,
          ...(item.paragraphs || []),
        ].filter(Boolean)) {
          assert.ok(
            html.includes(escape(text)),
            `${edition.edition_date}: missing copy for ${item.event_id}`,
          );
        }
        for (const source of item.sources)
          assert.ok(
            html.includes(
              `href="${escape(source.url)}" target="_blank" rel="noopener noreferrer"`,
            ),
            `Missing safe source ${source.url}`,
          );
      }
      assert.ok(html.includes(escape(edition.takeaway)));
      assert.ok(!html.includes("{{"), "Unrendered template variable");
    }
  }
});

test("root is the latest edition; archives include all available editions newest first", async () => {
  for (const language of ["vi", "en"]) {
    const localized = editions
      .map((e) => translatedEdition(e, language))
      .filter(Boolean)
      .reverse();
    if (!localized.length) continue;
    const prefix = language === "en" ? "en/" : "";
    const root = await readFile(`dist/${prefix}index.html`, "utf8");
    assert.ok(root.includes(escape(localized[0].headline)));
    const archive = await readFile(`dist/${prefix}archive/index.html`, "utf8");
    let previous = -1;
    for (const edition of localized) {
      const position = archive.indexOf(
        `href="${basePath}/${prefix}${edition.edition_date}/"`,
      );
      assert.ok(
        position > previous,
        `${prefix}archive order: ${edition.edition_date}`,
      );
      previous = position;
    }
  }
});

test("all exported HTML has valid local asset, route, and fragment targets under the Pages base path", async () => {
  const files = await readdir("dist", { recursive: true });
  const htmlFiles = files.filter((file) => file.endsWith(".html"));
  const cache = new Map();
  for (const file of htmlFiles)
    cache.set(file, await readFile(path.join("dist", file), "utf8"));
  for (const [file, html] of cache) {
    const pageUrl = new URL(
      `${basePath}/${file.replace(/index\.html$/, "")}`,
      "https://example.test",
    );
    for (const match of html.matchAll(/(?:href|src)="([^"<>]+)"/g)) {
      const raw = match[1].replaceAll("&amp;", "&");
      if (/^(?:https?:|data:|mailto:)/.test(raw) || raw.includes("favicon.ico"))
        continue;
      const url = new URL(raw, pageUrl);
      assert.ok(
        !basePath || url.pathname.startsWith(`${basePath}/`),
        `${file}: bad base path ${raw}`,
      );
      const relative = decodeURIComponent(
        url.pathname.slice(basePath.length),
      ).replace(/^\//, "");
      const target =
        relative.endsWith("/") || !relative
          ? `${relative}index.html`
          : relative;
      await assert.doesNotReject(
        stat(path.join("dist", target)),
        `${file}: missing target ${raw}`,
      );
      if (url.hash && cache.has(target)) {
        const id = decodeURIComponent(url.hash.slice(1));
        assert.ok(
          cache.get(target).includes(`id="${id}"`),
          `${file}: missing fragment ${raw}`,
        );
      }
    }
  }
  await assert.doesNotReject(stat("dist/.nojekyll"));
});
