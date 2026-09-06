import Link from "next/link";
import { notFound } from "next/navigation";
import { getLearning, learningTracks } from "../../../../lib/learning.mjs";
import { basePath, siteUrl } from "../../../../lib/site.mjs";
export const dynamicParams = false;
export async function generateStaticParams() {
  return (await getLearning()).articles.map((a) => ({ slug: a.slug }));
}
async function articleFor(params) {
  const { slug } = await params;
  const data = await getLearning();
  const article = data.articles.find((a) => a.slug === slug);
  if (!article) notFound();
  return { ...data, article };
}
export async function generateMetadata({ params }) {
  const { article } = await articleFor(params);
  return {
    title: `${article.title} · AI Morning`,
    description: article.summary,
    alternates: { canonical: `${siteUrl}${basePath}/learn/${article.slug}/` },
  };
}
export default async function LearningArticle({ params }) {
  const { article: a, articles, updated_at } = await articleFor(params);
  const track = learningTracks.find((t) => t.id === a.track);
  const related = articles.filter(
    (b) => b.track === a.track && b.slug !== a.slug,
  );
  return (
    <main id="main-content" className="shell learn-main">
      <article className="learn-article">
        <Link className="learn-back" href={`/learn/#${a.track}`}>
          ← {track.title}
        </Link>
        <header>
          <span className="eyebrow">HỌC & LÀM · BÀI THỰC HÀNH</span>
          <h1>{a.title}</h1>
          <p className="learn-summary">{a.summary}</p>
          <div className="learn-meta">
            <span>{a.tools}</span>
            <span>Thực hành: {a.practice_time}</span>
            <time dateTime={updated_at}>
              Biên soạn {updated_at.split("-").reverse().join("/")}
            </time>
          </div>
        </header>
        <section className="learn-context" id="work">
          <h2>Liên hệ với công việc</h2>
          <p>{a.work_connection}</p>
        </section>
        <section id="prepare">
          <h2>Chuẩn bị</h2>
          <p>{a.setup}</p>
        </section>
        <nav className="learn-toc" aria-label="Các bước thực hành">
          <strong>Làm theo từng bước</strong>
          <ol>
            {a.steps.map((s, i) => (
              <li key={s.title}>
                <a href={`#step-${i + 1}`}>{s.title}</a>
              </li>
            ))}
          </ol>
        </nav>
        {a.steps.map((s, i) => (
          <section className="learn-step" id={`step-${i + 1}`} key={s.title}>
            <span className="eyebrow">
              BƯỚC {String(i + 1).padStart(2, "0")}
            </span>
            <h2>{s.title}</h2>
            <p>{s.text}</p>
          </section>
        ))}
        <section className="learn-result" id="result">
          <h2>Khi nào coi là hoàn thành?</h2>
          <ul>
            {a.done.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2>Chỗ dễ mất thời gian</h2>
          <p>{a.pitfall}</p>
        </section>
        <section className="learn-ai">
          <h2>Nhờ AI hỗ trợ đúng việc</h2>
          <p>
            Thay phần mô tả bằng tình huống của bạn. Dùng dữ liệu mẫu hoặc thông
            tin được phép chia sẻ.
          </p>
          <blockquote>{a.ai_prompt}</blockquote>
        </section>
        <section className="learn-sources" id="sources">
          <h2>Tài liệu để làm tiếp</h2>
          <p>
            Các bước trên là lộ trình thực hành do AI Morning biên soạn. Mở tài
            liệu gốc để xem thao tác chi tiết và chọn phiên bản khớp với công cụ
            đang dùng. Bài chưa được xác nhận đã chạy thử trọn vẹn trên từng
            phiên bản.
          </p>
          <ul>
            {a.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </section>
        <nav className="learn-next" aria-label="Bài học tiếp theo">
          <Link href="/learn/">← Tất cả bài học</Link>
          {related.map((b) => (
            <Link href={`/learn/${b.slug}/`} key={b.slug}>
              {b.title} →
            </Link>
          ))}
        </nav>
      </article>
    </main>
  );
}
