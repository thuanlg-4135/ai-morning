const isRecord = (v) =>
  v !== null && typeof v === "object" && !Array.isArray(v);
const hasText = (v) => typeof v === "string" && v.trim().length > 0;

export function translatedEdition(edition, language) {
  if (language === "vi") return edition;
  const translation = edition.translations?.[language];
  if (!isRecord(translation)) return null;
  const localized = structuredClone(edition);
  const mergeText = (target, overlay, keys) => {
    if (!isRecord(overlay)) return;
    keys.forEach((key) => {
      if (overlay[key] !== undefined) target[key] = overlay[key];
    });
  };
  mergeText(localized, translation, [
    "headline",
    "dek",
    "takeaway",
    "watching",
  ]);
  mergeText(localized.hero_visual, translation.hero_visual, ["caption", "alt"]);
  mergeText(localized.developer_memo, translation.developer_memo, [
    "title",
    "direct_answer",
    "actions",
    "avoid",
  ]);
  mergeText(localized.wildcard, translation.wildcard, ["title", "text"]);
  for (const section of ["brief", "trends", "releases", "radar"]) {
    const overlays = translation[section];
    if (!isRecord(overlays)) continue;
    localized[section].forEach((item) => {
      const overlay = overlays[item.event_id];
      mergeText(item, overlay, [
        "title",
        "text",
        "paragraphs",
        "pullquote",
        "action",
        "product",
        "feature",
        "summary",
        "what_changed",
        "who_gets_it",
        "why_it_matters",
        "verdict_note",
      ]);
      mergeText(item.visual, overlay?.visual, ["caption", "alt"]);
      if (Array.isArray(overlay?.source_labels)) {
        overlay.source_labels.forEach((label, index) => {
          if (item.sources[index] && hasText(label))
            item.sources[index].label = label;
        });
      }
    });
  }
  localized.locale = "en-US";
  return localized;
}
