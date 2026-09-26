import Link from "next/link";
import { datePath, formatDate, homePath, words } from "../../lib/site.mjs";
import {
  storiesForEdition,
  sectionLabel,
  newsSections,
} from "../../lib/stories.mjs";
import { SiteHeader, SiteFooter } from "../layout/site-header";
import { StoryBody } from "./story-body";
import { Visual } from "./visual";
import { MemoChecklist } from "../reading/memo-checklist";
import styles from "./news.module.css";

export function EditionPage({ edition, editions, language, languageHref }) {
  const t = words(language);
  const vi = language === "vi";
  const stories = storiesForEdition(edition, language);
  const index = editions.findIndex(
    (e) => e.edition_date === edition.edition_date,
  );
  return (
    <>
      <SiteHeader {...{ edition, language, languageHref }} compact />
      <main className="shell" id="main-content">
        <header className={styles.editionHeader}>
          <span className={styles.kicker}>
            {t.edition} {edition.edition_number} ·{" "}
            {formatDate(edition.edition_date, language)}
          </span>
          <h1>{edition.headline}</h1>
          <p>{edition.dek}</p>
          <span className={styles.meta}>
            {edition.meta?.reading_minutes ?? 5} {t.minutes}
          </span>
        </header>
        <div className={styles.articleLayout}>
          <div className={styles.articleMain}>
            {newsSections.map((section) => (
              <section
                id={section}
                key={section}
                className={styles.editionSection}
              >
                {section === "brief" && <span id="briefing" />}
                {stories.some((s) => s.section === section) && (
                  <div className={styles.sectionHeading}>
                    <h2>{sectionLabel(section, language)}</h2>
                  </div>
                )}
                {stories
                  .filter((s) => s.section === section)
                  .map((story) => (
                    <StoryBody
                      key={story.event_id}
                      story={story}
                      language={language}
                    />
                  ))}
              </section>
            ))}
            <section className={`${styles.memo} ${styles.prose}`} id="memo">
              <span id="developer" />
              <span className={styles.kicker}>DEVELOPER MEMO</span>
              <h2>{edition.developer_memo.title}</h2>
              <p>{edition.developer_memo.direct_answer}</p>
              <h3>{t.do}</h3>
              <MemoChecklist
                actions={edition.developer_memo.actions}
                language={language}
              />
              <h3>{t.avoid}</h3>
              <ul>
                {edition.developer_memo.avoid.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
            {edition.wildcard && (
              <section className={styles.prose} id="wildcard">
                <h2>{edition.wildcard.title}</h2>
                <p>{edition.wildcard.text}</p>
              </section>
            )}
            <section className={styles.takeaway} id="takeaway">
              <h2>{t.remember}</h2>
              <p>{edition.takeaway}</p>
            </section>
          </div>
          <aside className={styles.related}>
            <h2>{t.inside}</h2>
            <nav className={styles.contents}>
              {stories.map((story) => (
                <a href={`#${story.anchor}`} key={story.event_id}>
                  {story.title}
                </a>
              ))}
              <a href="#memo">{t.memo}</a>
              <a href="#takeaway">{t.remember}</a>
            </nav>
            <Visual visual={edition.hero_visual} />
            {edition.one_number && (
              <p className={styles.stat}>
                <strong>{edition.one_number.value}</strong>
                {edition.one_number.label}
                <small>{edition.one_number.context}</small>
              </p>
            )}
            {edition.watching?.length > 0 && (
              <div className={styles.watching}>
                <h3>{t.radar}</h3>
                {edition.watching.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            )}
          </aside>
        </div>
        <nav
          className={styles.pagination}
          aria-label={vi ? "Các số báo" : "Editions"}
        >
          {editions[index + 1] && (
            <Link href={datePath(editions[index + 1].edition_date, language)}>
              ← {formatDate(editions[index + 1].edition_date, language)}
            </Link>
          )}
          <Link href={`${homePath(language)}archive/`}>{t.archive}</Link>
          {editions[index - 1] && (
            <Link href={datePath(editions[index - 1].edition_date, language)}>
              {formatDate(editions[index - 1].edition_date, language)} →
            </Link>
          )}
        </nav>
      </main>
      <SiteFooter language={language} />
    </>
  );
}
