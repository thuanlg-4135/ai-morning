import Link from "next/link";
import { datePath, formatDate, homePath } from "../../lib/site.mjs";
import {
  collectStories,
  storiesForEdition,
  sectionLabel,
} from "../../lib/stories.mjs";
import { SiteHeader, SiteFooter } from "../layout/site-header";
import { StoryPreview, StoryShelf } from "./story-preview";
import styles from "./news.module.css";

export function FrontPage({
  edition,
  editions,
  language,
  languageHref,
  learning = [],
}) {
  const vi = language === "vi";
  const current = storiesForEdition(edition, language);
  const used = new Set(current.map((s) => s.event_id));
  const older = collectStories(editions, language).filter(
    (s) => !used.has(s.event_id),
  );
  const quick = older.filter((s) => s.section === "brief").slice(0, 4);
  quick.forEach((s) => used.add(s.event_id));
  const shelves = ["trends", "releases", "brief", "radar"].map((section) => ({
    section,
    stories: older
      .filter((s) => s.section === section && !used.has(s.event_id))
      .slice(0, 4),
  }));
  return (
    <>
      <SiteHeader {...{ edition, language, languageHref }} />
      <main id="main-content" className="shell">
        <div className={styles.editionLine}>
          <span>
            {vi ? "SỐ MỚI NHẤT" : "LATEST EDITION"} ·{" "}
            {formatDate(edition.edition_date, language)}
          </span>
          <Link href={datePath(edition.edition_date, language)}>
            {edition.headline} →
          </Link>
        </div>
        <div className={styles.frontGrid}>
          <StoryPreview
            story={current[0]}
            language={language}
            variant="lead"
            priority
          />
          <div className={styles.secondary}>
            {current.slice(1).map((story) => (
              <StoryPreview
                key={story.event_id}
                story={story}
                language={language}
              />
            ))}
          </div>
          <aside
            className={styles.quickRail}
            aria-label={vi ? "Tin từ các số trước" : "From earlier editions"}
          >
            <h2>{vi ? "Tin ngắn" : "In brief"}</h2>
            <p className={styles.railNote}>
              {vi ? "Từ các số trước" : "From earlier editions"}
            </p>
            {quick.map((story) => (
              <StoryPreview
                key={story.event_id}
                story={story}
                language={language}
                variant="compact"
                image={false}
              />
            ))}
            <Link
              className={styles.allLink}
              href={`${homePath(language)}archive/`}
            >
              {vi ? "Tất cả bản tin" : "All editions"} →
            </Link>
          </aside>
        </div>
        {shelves.map(({ section, stories }) => (
          <StoryShelf
            key={section}
            id={section}
            title={sectionLabel(section, language)}
            stories={stories}
            language={language}
            note={
              vi
                ? "Từ các số trước · Ngày đăng dưới mỗi bài"
                : "Earlier editions · Dates shown below each story"
            }
          />
        ))}
        {learning.length > 0 && (
          <section className={styles.shelf} id="library">
            <div className={styles.sectionHeading}>
              <h2>Thư viện thực hành</h2>
              <Link href="/learn/">Xem tất cả →</Link>
            </div>
            <div className={styles.learningStrip}>
              {learning.slice(0, 3).map((a) => (
                <article key={a.slug}>
                  <span className={styles.kicker}>{a.tools}</span>
                  <h3>
                    <Link href={`/learn/${a.slug}/`}>{a.title}</Link>
                  </h3>
                  <p>{a.summary}</p>
                  <small>Thực hành · {a.practice_time}</small>
                </article>
              ))}
            </div>
          </section>
        )}
        <div className={styles.editionLink}>
          <p>
            {vi
              ? "Muốn đọc trọn vẹn số mới nhất?"
              : "Read the complete latest edition"}
          </p>
          <Link href={datePath(edition.edition_date, language)}>
            {edition.headline} →
          </Link>
        </div>
      </main>
      <SiteFooter language={language} />
    </>
  );
}
