import { getEditions, inLanguage } from "../lib/editions.mjs";
import { storiesForEdition } from "../lib/stories.mjs";
import { getLearning } from "../lib/learning.mjs";
import { datePath, homePath } from "../lib/site.mjs";
import { absoluteUrl } from "../lib/metadata.mjs";

export const dynamic = "force-static";
export default async function sitemap() {
  const [editions, learning] = await Promise.all([
    getEditions(),
    getLearning(),
  ]);
  const routes = [
    "/learn/",
    "/about/",
    ...learning.articles.map((a) => `/learn/${a.slug}/`),
  ];
  for (const language of ["vi", "en"]) {
    const localized = inLanguage(editions, language);
    if (!localized.length) continue;
    routes.push(
      homePath(language),
      `${homePath(language)}archive/`,
      ...localized.map((e) => datePath(e.edition_date, language)),
      ...localized.flatMap((e) =>
        storiesForEdition(e, language).map((s) => s.href),
      ),
    );
  }
  return routes.map((path) => ({ url: absoluteUrl(path) }));
}
