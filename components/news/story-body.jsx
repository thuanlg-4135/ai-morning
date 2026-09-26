import { basePath, words } from "../../lib/site.mjs";
import { ReadingTools } from "../reading/preferences";
import { StoryActions } from "../reading/story-actions";
import { Visual } from "./visual";
import { StoryMeta } from "./story-preview";
import styles from "./news.module.css";

export function SourceList({ sources = [], language = "vi" }) {
  return (
    <section
      className={styles.sources}
      aria-label={language === "vi" ? "Nguồn tham khảo" : "Sources"}
    >
      <h2>{language === "vi" ? "Nguồn tham khảo" : "Sources"}</h2>
      <ol>
        {sources.map((source) => (
          <li key={source.url}>
            <a href={source.url} target="_blank" rel="noopener noreferrer">
              {source.label} ↗
            </a>
            {source.published_at && (
              <time dateTime={source.published_at}>
                {source.published_at.slice(0, 10)}
              </time>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
export function StoryBody({ story, language = "vi", standalone = false }) {
  const t = words(language);
  const Heading = standalone ? "h1" : "h2";
  const vi = language === "vi";
  return (
    <article className={styles.article} id={story.anchor}>
      {story.anchor !== story.event_id && (
        <span id={story.event_id} className="anchor-alias" />
      )}
      {story.legacyAnchor && story.legacyAnchor !== story.anchor && (
        <span id={story.legacyAnchor} className="anchor-alias" />
      )}
      <header className={styles.articleHeader}>
        <div className={styles.kicker}>
          {story.product ||
            (vi ? "AI MORNING / BÀI VIẾT" : "AI MORNING / STORY")}
          {story.status && ` · ${story.status}`}
        </div>
        <Heading>{story.title}</Heading>
        {story.summary && <p className={styles.dek}>{story.summary}</p>}
        <div className={styles.byline}>
          <StoryMeta story={story} language={language} />
          {standalone && <ReadingTools language={language} />}
          <StoryActions
            id={`${story.date}:${story.event_id}`}
            title={story.title}
            href={`${basePath}${story.href}`}
            language={language}
          />
        </div>
      </header>
      <Visual visual={story.visual} priority={standalone} />
      <div className={styles.prose}>
        {story.text && <p>{story.text}</p>}
        {story.paragraphs?.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
        {story.pullquote && <blockquote>{story.pullquote}</blockquote>}
        {story.stat && (
          <p className={styles.stat}>
            <strong>{story.stat.value}</strong> {story.stat.label}
            {story.stat.context && <small>{story.stat.context}</small>}
          </p>
        )}
        {[
          ["what_changed", vi ? "Thay đổi" : "What changed"],
          ["who_gets_it", vi ? "Dành cho ai" : "Availability"],
          ["why_it_matters", vi ? "Tác động" : "Impact"],
        ].map(
          ([key, label]) =>
            story[key] && (
              <section key={key}>
                <h3>{label}</h3>
                <p>{story[key]}</p>
              </section>
            ),
        )}
        {story.action && (
          <section className={styles.action}>
            <h3>{t.action}</h3>
            <p>{story.action}</p>
          </section>
        )}
        {story.verdict_note && (
          <section className={styles.action}>
            <h3>
              {
                (vi
                  ? {
                      TRY_NOW: "Nên thử",
                      WATCH: "Theo dõi",
                      SKIP_FOR_NOW: "Chưa nên dùng",
                    }
                  : {
                      TRY_NOW: "Try now",
                      WATCH: "Watch",
                      SKIP_FOR_NOW: "Skip for now",
                    })[story.verdict]
              }
            </h3>
            <p>{story.verdict_note}</p>
          </section>
        )}
      </div>
      <SourceList sources={story.sources} language={language} />
    </article>
  );
}
