import { readdir, readFile } from "node:fs/promises";
import { cache } from "react";
import { assertEditionSchema } from "../scripts/news/schema.mjs";
import { translatedEdition } from "./localize.mjs";

export const getEditions = cache(async () => {
  const names = (await readdir("content"))
    .filter((name) => /^\d{4}-\d{2}-\d{2}\.json$/.test(name))
    .sort();
  return Promise.all(
    names.map(async (name, index) => {
      const edition = JSON.parse(await readFile(`content/${name}`, "utf8"));
      assertEditionSchema(edition, name);
      return {
        ...edition,
        edition_number: edition.edition_number ?? index + 1,
      };
    }),
  ).then((editions) => editions.reverse());
});

export function inLanguage(editions, language) {
  return editions
    .map((edition) => translatedEdition(edition, language))
    .filter(Boolean);
}

export function editionSummary(edition) {
  return {
    date: edition.edition_date,
    title: edition.headline,
    dek: edition.dek,
    number: edition.edition_number,
    minutes: edition.meta?.reading_minutes ?? 5,
    topics: [
      ...new Set(
        [
          ...edition.brief,
          ...edition.trends,
          ...edition.releases,
          ...edition.radar,
        ].map((item) => item.event_signature.organization),
      ),
    ],
  };
}

export function editionStories(edition) {
  return ["brief", "trends", "releases", "radar"].flatMap((section) =>
    edition[section].map((item) => ({
      id: item.id || item.event_id,
      date: edition.edition_date,
      section,
      title: item.title || item.feature || item.event_signature.product,
      excerpt: item.text || item.summary || item.paragraphs?.[0] || "",
      searchText: [
        item.text,
        item.summary,
        ...(item.paragraphs || []),
        item.action,
        item.who_gets_it,
        item.why_it_matters,
        item.verdict_note,
        item.product,
      ]
        .filter(Boolean)
        .join(" "),
    })),
  );
}
