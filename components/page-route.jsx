import { notFound } from "next/navigation";
import { getEditions, inLanguage } from "../lib/editions.mjs";
import { getLearning } from "../lib/learning.mjs";
import { storiesForEdition, storyPath } from "../lib/stories.mjs";
import { datePath, homePath } from "../lib/site.mjs";
import { pageMetadata } from "../lib/metadata.mjs";
import { FrontPage } from "./news/front-page";
import { EditionPage } from "./news/edition-page";
import { ArticlePage } from "./news/article-page";
import { ArchivePage } from "./archive/archive-page";

export async function allStaticParams() {
  const all = await getEditions();
  return ["vi", "en"].flatMap((language) => {
    const editions = inLanguage(all, language);
    if (!editions.length) return [];
    const prefix = language === "en" ? ["en"] : [];
    return [
      { slug: prefix },
      { slug: [...prefix, "archive"] },
      ...editions.flatMap((e) => [
        { slug: [...prefix, e.edition_date] },
        ...storiesForEdition(e, language).map((s) => ({
          slug: [...prefix, e.edition_date, s.event_id],
        })),
      ]),
    ];
  });
}
async function getPage(params) {
  const { slug = [] } = await params;
  const language = slug[0] === "en" ? "en" : "vi";
  const segments = language === "en" ? slug.slice(1) : slug;
  if (segments.length > 2 || (segments[0] === "archive" && segments.length > 1))
    notFound();
  const all = await getEditions();
  const editions = inLanguage(all, language);
  const archive = segments[0] === "archive";
  const home = segments.length === 0;
  const edition =
    home || archive
      ? editions[0]
      : editions.find((e) => e.edition_date === segments[0]);
  if (!edition) notFound();
  const story =
    segments.length === 2
      ? storiesForEdition(edition, language).find(
          (s) => s.event_id === segments[1],
        )
      : null;
  if (segments.length === 2 && !story) notFound();
  const otherLanguage = language === "vi" ? "en" : "vi";
  const other = inLanguage(all, otherLanguage);
  const equivalent = other.find((e) => e.edition_date === edition.edition_date);
  const translatedStory =
    story &&
    equivalent &&
    storiesForEdition(equivalent, otherLanguage).find(
      (s) => s.event_id === story.event_id,
    );
  const languageHref = !other.length
    ? null
    : archive
      ? `${homePath(otherLanguage)}archive/`
      : home
        ? homePath(otherLanguage)
        : translatedStory
          ? translatedStory.href
          : datePath(
              equivalent?.edition_date ?? other[0].edition_date,
              otherLanguage,
            );
  return { edition, editions, language, archive, home, story, languageHref };
}
export async function generateMetadata({ params }) {
  const { edition, language, archive, home, story } = await getPage(params);
  return pageMetadata({
    title: `${archive ? (language === "vi" ? "Kho bản tin" : "Archive") : home ? (language === "vi" ? "AI Morning — Tin công nghệ cho kỹ sư phần mềm" : "AI Morning — Technology news for software engineers") : story?.title || edition.headline}${home ? "" : " · AI Morning"}`,
    description: archive
      ? language === "vi"
        ? "Tìm số báo, bài viết và bài đã lưu trên AI Morning."
        : "Search AI Morning editions, stories and saved reading."
      : home
        ? edition.dek
        : story?.excerpt || edition.dek,
    language,
    path: archive
      ? `${homePath(language)}archive/`
      : home
        ? homePath(language)
        : story
          ? storyPath(story.date, story.event_id, language)
          : datePath(edition.edition_date, language),
    date: archive ? undefined : edition.edition_date,
  });
}
export default async function Page({ params }) {
  const page = await getPage(params);
  if (page.archive) return <ArchivePage {...page} />;
  if (page.story) return <ArticlePage {...page} />;
  if (page.home) {
    const learning =
      page.language === "vi" ? (await getLearning()).articles : [];
    return <FrontPage {...page} learning={learning} />;
  }
  return <EditionPage {...page} />;
}
