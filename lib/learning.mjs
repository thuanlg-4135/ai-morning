import { readFile } from "node:fs/promises";
import { cache } from "react";

export const learningTracks = [
  {
    id: "work",
    title: "Developer trong công ty",
    description: "Từ ticket đến test, API và một bản bàn giao rõ ràng.",
    mark: "01",
  },
  {
    id: "animation",
    title: "Hoạt hình 3D & video",
    description: "Tạo chuyển động, dựng clip và xuất một thành phẩm nhỏ.",
    mark: "02",
  },
  {
    id: "games",
    title: "Làm game",
    description: "Bắt đầu ở 2D, hoàn thành vòng chơi rồi tiến lên 3D.",
    mark: "03",
  },
];
export const getLearning = cache(async () => {
  const data = JSON.parse(
    await readFile("content/learning/index.json", "utf8"),
  );
  const slugs = new Set();
  if (data.schema_version !== 1 || !Array.isArray(data.articles))
    throw new Error("Invalid learning collection");
  for (const a of data.articles) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(a.slug) || slugs.has(a.slug))
      throw new Error(`Invalid or duplicate learning slug: ${a.slug}`);
    slugs.add(a.slug);
    if (!learningTracks.some((t) => t.id === a.track))
      throw new Error(`Unknown track: ${a.track}`);
    for (const field of [
      "title",
      "summary",
      "practice_time",
      "tools",
      "setup",
      "work_connection",
      "pitfall",
      "ai_prompt",
    ]) {
      if (typeof a[field] !== "string" || !a[field].trim())
        throw new Error(`${a.slug}: missing ${field}`);
    }
    if (
      !a.steps?.length ||
      a.steps.some((s) => !s.title || !s.text) ||
      !a.done?.length ||
      !a.sources?.length
    )
      throw new Error(`${a.slug}: incomplete practical guide`);
    for (const s of a.sources)
      if (!s.label || new URL(s.url).protocol !== "https:")
        throw new Error(`${a.slug}: invalid source`);
  }
  return data;
});
