import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getLearning, learningTracks } from "../../../lib/learning.mjs";
import { basePath, siteUrl } from "../../../lib/site.mjs";
export const metadata = {
  title: "Học & làm · AI Morning",
  description:
    "Bài thực hành cho developer: công việc trong team, hoạt hình 3D, dựng video và làm game.",
  alternates: { canonical: `${siteUrl}${basePath}/learn/` },
};

export default async function LearningIndex() {
  const { articles } = await getLearning();
  return (
    <main id="main-content" className="shell learn-main">
      <header className="learn-intro">
        <span className="eyebrow">THE PRACTICE ROOM</span>
        <h1>
          Đọc để hiểu.
          <br />
          <em>Làm để biết.</em>
        </h1>
        <p>
          Những bài học nối với công việc developer, và một góc để thử sức với
          hoạt hình 3D, video, game. Mỗi bài bắt đầu từ một việc nhỏ, kết thúc
          bằng thứ có thể kiểm tra hoặc chia sẻ.
        </p>
        <span className="learn-count">
          {articles.length} bài thực hành · 3 hướng khám phá
        </span>
      </header>
      <nav className="learn-tracks" aria-label="Hướng học">
        {learningTracks.map((t) => (
          <a href={`#${t.id}`} key={t.id}>
            <span>{t.mark}</span>
            {t.title}
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        ))}
      </nav>
      {learningTracks.map((t) => (
        <section className="learn-track" id={t.id} key={t.id}>
          <div className="learn-track-heading">
            <span>{t.mark}</span>
            <div>
              <h2>{t.title}</h2>
              <p>{t.description}</p>
            </div>
          </div>
          <div className="learn-cards">
            {articles
              .filter((a) => a.track === t.id)
              .map((a) => (
                <article className="learn-card" key={a.slug}>
                  <span className="eyebrow">{a.tools}</span>
                  <h3>
                    <Link href={`/learn/${a.slug}/`}>{a.title}</Link>
                  </h3>
                  <p>{a.summary}</p>
                  <div className="learn-card-bottom">
                    <span>{a.practice_time}</span>
                    <Link
                      href={`/learn/${a.slug}/`}
                      aria-label={`Đọc bài: ${a.title}`}
                    >
                      Đọc & thực hành{" "}
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
          </div>
        </section>
      ))}
      <p className="learn-editor-note">
        Bài học có thể đọc lại bất cứ lúc nào. Thời gian thực hành là ước tính,
        không bao gồm cài đặt công cụ. Chọn một bài, hoàn thành bản nhỏ trước
        khi học tiếp.
      </p>
    </main>
  );
}
