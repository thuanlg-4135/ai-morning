import { notFound } from "next/navigation";
import {
  getEditions,
  inLanguage,
  editionSummary,
  editionStories,
} from "../lib/editions.mjs";
import { datePath, homePath } from "../lib/site.mjs";
import { pageMetadata } from "../lib/metadata.mjs";
import { EditionPage, ArchivePage } from "./newspaper";

export async function allStaticParams() {
  const editions = await getEditions();
  const english = inLanguage(editions, "en");
  return [
    { slug: [] },
    { slug: ["archive"] },
    ...editions.map((e) => ({ slug: [e.edition_date] })),
    ...(english.length
      ? [
          { slug: ["en"] },
          { slug: ["en", "archive"] },
          ...english.map((e) => ({ slug: ["en", e.edition_date] })),
        ]
      : []),
  ];
}

async function getPage(params) {
  const { slug = [] } = await params;
  const language = slug[0] === "en" ? "en" : "vi";
  const segments = language === "en" ? slug.slice(1) : slug;
  if (segments.length > 1) notFound();
  const all = await getEditions();
  const editions = inLanguage(all, language);
  const archive = segments[0] === "archive";
  const edition =
    !segments.length || archive
      ? editions[0]
      : editions.find((e) => e.edition_date === segments[0]);
  if (!edition) notFound();
  const otherLanguage = language === "vi" ? "en" : "vi";
  const other = inLanguage(all, otherLanguage);
  const equivalent = other.find((e) => e.edition_date === edition.edition_date);
  const languageHref = other.length
    ? archive
      ? `${homePath(otherLanguage)}archive/`
      : datePath(
          equivalent?.edition_date ?? other[0].edition_date,
          otherLanguage,
        )
    : null;
  return { edition, editions, language, archive, languageHref };
}

export async function generateMetadata({ params }) {
  const { edition, language, archive } = await getPage(params);
  const title = archive
    ? `${language === "en" ? "Archive" : "Bài cũ"} · AI Morning`
    : `${edition.headline} · AI Morning`;
  const description = archive
    ? language === "en"
      ? "Browse past AI Morning editions. Search AI news, developer tools, and saved stories."
      : "Tìm lại các số AI Morning theo ngày, chủ đề và công cụ. Đọc tiếp những bài bạn đã lưu."
    : edition.dek;
  return pageMetadata({
    title,
    description,
    language,
    path: archive
      ? `${homePath(language)}archive/`
      : datePath(edition.edition_date, language),
    date: archive ? undefined : edition.edition_date,
  });
}

export default async function Page({ params }) {
  const page = await getPage(params);
  const summaries = page.editions.map(editionSummary);
  return page.archive ? (
    <ArchivePage
      {...page}
      summaries={summaries}
      stories={page.editions.flatMap(editionStories)}
    />
  ) : (
    <EditionPage {...page} summaries={summaries} />
  );
}
