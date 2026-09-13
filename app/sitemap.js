import { getEditions, inLanguage } from "../lib/editions.mjs";
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
    // The latest home is an alias of a dated edition; list canonical URLs only.
    routes.push(
      `${homePath(language)}archive/`,
      ...localized.map((e) => datePath(e.edition_date, language)),
    );
  }
  return routes.map((path) => ({ url: absoluteUrl(path) }));
}
