import { SiteHeader, SiteFooter } from "../layout/site-header";
import { ArchiveBrowser } from "./archive-browser";
import { editionSummary } from "../../lib/editions.mjs";
import { storiesForEdition } from "../../lib/stories.mjs";

export function ArchivePage({ edition, editions, language, languageHref }) {
  const stories = editions
    .flatMap((e) => storiesForEdition(e, language))
    .map((s) => ({
      id: s.event_id,
      date: s.date,
      section: s.section,
      title: s.title,
      excerpt: s.excerpt,
      href: s.href,
      searchText: [
        s.text,
        s.summary,
        ...(s.paragraphs || []),
        s.action,
        s.product,
        s.what_changed,
        s.who_gets_it,
        s.why_it_matters,
        s.verdict_note,
      ]
        .filter(Boolean)
        .join(" "),
    }));
  return (
    <>
      <SiteHeader {...{ edition, language, languageHref }} compact />
      <main className="shell archive-main" id="main-content">
        <header className="archive-intro">
          <span className="eyebrow">
            AI MORNING / {language === "vi" ? "KHO BẢN TIN" : "ARCHIVE"}
          </span>
          <h1>
            {language === "vi"
              ? "Những số báo đã xuất bản"
              : "The newspaper archive"}
          </h1>
          <p>
            {language === "vi"
              ? "Tìm theo ngày, chủ đề hoặc nội dung. Đọc lại những bài bạn đã lưu."
              : "Search by date, topic or story. Return to your saved reading."}
          </p>
        </header>
        <ArchiveBrowser
          editions={editions.map(editionSummary)}
          stories={stories}
          language={language}
        />
      </main>
      <SiteFooter language={language} />
    </>
  );
}
