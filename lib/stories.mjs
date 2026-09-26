import { datePath } from "./site.mjs";

export const newsSections = ["trends", "releases", "brief", "radar"];
export function sectionLabel(section, language = "vi") {
  const labels =
    language === "en"
      ? {
          trends: "Analysis",
          releases: "Tools & releases",
          brief: "News in brief",
          radar: "On the radar",
        }
      : {
          trends: "Góc nhìn",
          releases: "AI & công cụ",
          brief: "Tin nhanh",
          radar: "Theo dõi",
        };
  return labels[section];
}
export function storyPath(date, id, language = "vi") {
  return `${datePath(date, language)}${encodeURIComponent(id)}/`;
}
export function storiesForEdition(edition, language = "vi") {
  return newsSections.flatMap((section) =>
    edition[section].map((item, index) => {
      const title =
        item.title ||
        (item.feature
          ? `${item.product}: ${item.feature}`
          : item.event_signature.product);
      const text = [
        item.text,
        item.summary,
        ...(item.paragraphs || []),
        item.what_changed,
        item.who_gets_it,
        item.why_it_matters,
        item.action,
        item.verdict_note,
      ]
        .filter(Boolean)
        .join(" ");
      return {
        ...item,
        title,
        section,
        date: edition.edition_date,
        anchor: item.id || item.event_id,
        legacyAnchor:
          section === "releases"
            ? `release-${item.event_id}`
            : section === "trends" && !item.id
              ? `trend-${index + 1}`
              : null,
        excerpt: item.text || item.summary || item.paragraphs?.[0] || "",
        minutes: Math.max(1, Math.ceil(text.split(/\s+/).length / 220)),
        href: storyPath(edition.edition_date, item.event_id, language),
      };
    }),
  );
}
// Newest occurrence wins. This is discovery across published editions, not a new edition.
export function collectStories(editions, language = "vi") {
  const seen = new Set();
  return editions
    .flatMap((e) => storiesForEdition(e, language))
    .filter((story) => {
      if (seen.has(story.event_id)) return false;
      seen.add(story.event_id);
      return true;
    });
}
