import Link from "next/link";
import { homePath, datePath } from "../../lib/site.mjs";
import { collectStories, sectionLabel } from "../../lib/stories.mjs";
import { SiteHeader, SiteFooter } from "../layout/site-header";
import { StoryBody } from "./story-body";
import { StoryPreview, StoryShelf } from "./story-preview";
import styles from "./news.module.css";

export function ArticlePage({
  edition,
  editions,
  story,
  language,
  languageHref,
}) {
  const vi = language === "vi";
  const candidates = collectStories(
    editions.filter((e) => e.edition_date <= edition.edition_date),
    language,
  ).filter((s) => s.event_id !== story.event_id);
  const related = [
    ...candidates.filter((s) => s.section === story.section),
    ...candidates.filter((s) => s.section !== story.section),
  ].slice(0, 7);
  return (
    <>
      <SiteHeader {...{ edition, language, languageHref }} compact />
      <main id="main-content" className="shell">
        <nav
          className={styles.breadcrumb}
          aria-label={vi ? "Đường dẫn" : "Breadcrumb"}
        >
          <Link href={homePath(language)}>{vi ? "Trang chủ" : "Home"}</Link>
          <span>/</span>
          <Link href={datePath(edition.edition_date, language)}>
            {edition.edition_date}
          </Link>
          <span>/</span>
          <span>{sectionLabel(story.section, language)}</span>
        </nav>
        <div className={styles.articleLayout}>
          <div className={styles.articleMain}>
            <StoryBody story={story} language={language} standalone />
            <div className={styles.articleEnd}>
              <Link href={datePath(edition.edition_date, language)}>
                ← {vi ? "Trở về bản tin" : "Back to edition"}
              </Link>
            </div>
          </div>
          <aside className={styles.related}>
            <h2>{vi ? "Đọc thêm" : "More to read"}</h2>
            {related.slice(0, 4).map((item) => (
              <StoryPreview
                key={item.event_id}
                story={item}
                language={language}
                variant="relatedStory"
              />
            ))}
          </aside>
        </div>
        <StoryShelf
          title={vi ? "Bài liên quan" : "Related stories"}
          stories={related.slice(4)}
          language={language}
        />
      </main>
      <SiteFooter language={language} />
    </>
  );
}
