import Link from "next/link";
import { formatDate } from "../../lib/site.mjs";
import { sectionLabel } from "../../lib/stories.mjs";
import { Visual } from "./visual";
import styles from "./news.module.css";

export function StoryMeta({ story, language = "vi" }) {
  return (
    <div className={styles.meta}>
      <span>{sectionLabel(story.section, language)}</span>
      <time dateTime={story.date}>{formatDate(story.date, language)}</time>
      <span>
        {story.minutes} {language === "vi" ? "phút đọc" : "min read"}
      </span>
    </div>
  );
}
export function StoryPreview({
  story,
  language = "vi",
  variant = "standard",
  image = true,
  priority = false,
}) {
  if (!story) return null;
  const Heading = variant === "lead" ? "h1" : "h2";
  return (
    <article
      className={`${styles.preview} ${styles[variant] || ""}`}
      data-story-id={story.event_id}
    >
      {image && story.visual && (
        <Link href={story.href} tabIndex={-1} aria-hidden="true">
          <Visual visual={story.visual} thumbnail priority={priority} />
        </Link>
      )}
      <Heading>
        <Link href={story.href}>{story.title}</Link>
      </Heading>
      <p className={styles.excerpt}>{story.excerpt}</p>
      <StoryMeta story={story} language={language} />
    </article>
  );
}
export function StoryShelf({ id, title, stories, language = "vi", note }) {
  if (!stories.length) return <span id={id} />;
  return (
    <section className={styles.shelf} id={id}>
      <div className={styles.sectionHeading}>
        <h2>{title}</h2>
        {note && <span>{note}</span>}
      </div>
      <div
        className={`${styles.storyGrid} ${stories.length === 4 ? styles.fourColumns : ""}`}
        style={{ "--columns": Math.min(stories.length, 4) }}
      >
        {stories.map((story, index) => (
          <StoryPreview
            key={story.event_id}
            story={story}
            language={language}
            variant={index === 0 ? "shelfLead" : "standard"}
          />
        ))}
      </div>
    </section>
  );
}
